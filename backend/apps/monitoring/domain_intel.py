import http.client
import ipaddress
import random
import socket
import ssl
import struct
from datetime import datetime, timezone
from urllib.parse import urlparse


DNS_TIMEOUT_SECONDS = 2.0
HTTP_TIMEOUT_SECONDS = 4.0

DNS_TYPES = {
    'A': 1,
    'AAAA': 28,
    'MX': 15,
    'TXT': 16,
}

SECURITY_HEADERS = {
    'strict-transport-security': 'Strict-Transport-Security',
    'content-security-policy': 'Content-Security-Policy',
    'x-content-type-options': 'X-Content-Type-Options',
    'x-frame-options': 'X-Frame-Options',
    'referrer-policy': 'Referrer-Policy',
    'permissions-policy': 'Permissions-Policy',
}

PROVIDER_REQUIRED_CHECKS = {
    'whois': {
        'status': 'skipped',
        'provider_required': True,
        'message': 'WHOIS and registrar history require a domain intelligence provider.',
    },
    'reputation': {
        'status': 'skipped',
        'provider_required': True,
        'message': 'Domain reputation and malware/phishing verdicts require third-party threat intelligence.',
    },
    'passive_dns': {
        'status': 'skipped',
        'provider_required': True,
        'message': 'Passive DNS history requires a third-party intelligence provider.',
    },
    'subdomains': {
        'status': 'skipped',
        'provider_required': True,
        'message': 'Broad subdomain enumeration requires a third-party discovery provider.',
    },
}


class DomainValidationError(ValueError):
    pass


def analyze_domain(value):
    domain = normalize_domain(value)

    dns = collect_dns_records(domain)
    email_auth = assess_email_auth(domain, dns['records'])
    http_headers = inspect_http_security_headers(domain)
    ssl_certificate = inspect_ssl_certificate(domain)
    typosquat = suggest_typosquats(domain)

    statuses = [
        dns['status'],
        email_auth['status'],
        http_headers['status'],
        ssl_certificate['status'],
    ]
    overall_status = summarize_status(statuses)

    return {
        'domain': domain,
        'status': overall_status,
        'live': True,
        'provider_required': False,
        'checks': {
            'dns': dns,
            'email_authentication': email_auth,
            'http_security_headers': http_headers,
            'ssl_certificate': ssl_certificate,
            'typosquat_suggestions': typosquat,
            **PROVIDER_REQUIRED_CHECKS,
        },
        'provider_required_checks': [
            name for name, check in PROVIDER_REQUIRED_CHECKS.items() if check['provider_required']
        ],
    }


def normalize_domain(value):
    if not value or not str(value).strip():
        raise DomainValidationError('Domain is required.')

    raw = str(value).strip().lower()
    parsed = urlparse(raw if '://' in raw else f'//{raw}')
    host = parsed.hostname or raw.split('/')[0]
    host = host.rstrip('.')

    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise DomainValidationError('Enter a domain name, not an IP address.')

    try:
        domain = host.encode('idna').decode('ascii')
    except UnicodeError as exc:
        raise DomainValidationError('Domain contains invalid characters.') from exc

    labels = domain.split('.')
    if len(labels) < 2 or len(domain) > 253:
        raise DomainValidationError('Domain must include a registrable name and suffix.')

    for label in labels:
        if not label or len(label) > 63:
            raise DomainValidationError('Domain contains an invalid label.')
        if label.startswith('-') or label.endswith('-'):
            raise DomainValidationError('Domain labels cannot start or end with a hyphen.')
        if not all(char.isalnum() or char == '-' for char in label):
            raise DomainValidationError('Domain contains invalid characters.')

    return domain


def collect_dns_records(domain):
    records = {'A': [], 'AAAA': [], 'MX': [], 'TXT': []}
    errors = {}

    for record_type in records:
        try:
            records[record_type] = query_dns(domain, record_type)
        except TimeoutError:
            errors[record_type] = 'DNS query timed out.'
        except OSError as exc:
            errors[record_type] = str(exc)

    has_address = bool(records['A'] or records['AAAA'])
    has_mail = bool(records['MX'])

    if has_address and has_mail:
        status = 'ok'
    elif has_address:
        status = 'warning'
    elif errors:
        status = 'unknown'
    else:
        status = 'warning'

    return {
        'status': status,
        'provider_required': False,
        'records': records,
        'errors': errors,
        'summary': {
            'has_a': bool(records['A']),
            'has_aaaa': bool(records['AAAA']),
            'has_mx': has_mail,
            'has_txt': bool(records['TXT']),
        },
    }


def assess_email_auth(domain, records):
    txt_values = [value.strip('"') for value in records.get('TXT', [])]
    spf_records = [value for value in txt_values if value.lower().startswith('v=spf1')]
    dmarc_records = []
    dmarc_errors = {}

    try:
        dmarc_records = [
            value.strip('"')
            for value in query_dns(f'_dmarc.{domain}', 'TXT')
            if value.lower().startswith('v=dmarc1')
        ]
    except Exception as exc:
        dmarc_errors['lookup'] = str(exc)

    has_spf = bool(spf_records)
    has_dmarc = bool(dmarc_records)
    if has_spf and has_dmarc:
        status = 'ok'
    elif has_spf or has_dmarc:
        status = 'warning'
    else:
        status = 'warning'

    return {
        'status': status,
        'provider_required': False,
        'spf': {'present': has_spf, 'records': spf_records},
        'dmarc': {'present': has_dmarc, 'records': dmarc_records, 'errors': dmarc_errors},
    }


def inspect_http_security_headers(domain):
    attempts = []

    for scheme, connection_class, port in (
        ('https', http.client.HTTPSConnection, 443),
        ('http', http.client.HTTPConnection, 80),
    ):
        try:
            conn = connection_class(domain, port=port, timeout=HTTP_TIMEOUT_SECONDS)
            conn.request('HEAD', '/', headers={'User-Agent': 'DarkWatch-Pro/1.0'})
            response = conn.getresponse()
            headers = {key.lower(): value for key, value in response.getheaders()}
            conn.close()

            present = {
                canonical: headers.get(lower)
                for lower, canonical in SECURITY_HEADERS.items()
                if lower in headers
            }
            missing = [
                canonical for lower, canonical in SECURITY_HEADERS.items() if lower not in headers
            ]
            status = 'ok' if not missing else 'warning'
            return {
                'status': status,
                'provider_required': False,
                'url': f'{scheme}://{domain}/',
                'http_status': response.status,
                'present': present,
                'missing': missing,
            }
        except Exception as exc:
            attempts.append({'url': f'{scheme}://{domain}/', 'error': str(exc)})

    return {
        'status': 'unknown',
        'provider_required': False,
        'present': {},
        'missing': list(SECURITY_HEADERS.values()),
        'errors': attempts,
    }


def inspect_ssl_certificate(domain):
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=HTTP_TIMEOUT_SECONDS) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as tls:
                cert = tls.getpeercert()
    except Exception as exc:
        return {
            'status': 'unknown',
            'provider_required': False,
            'error': str(exc),
        }

    not_after = cert.get('notAfter')
    expires_at = parse_cert_datetime(not_after) if not_after else None
    days_remaining = None
    status = 'ok'

    if expires_at:
        days_remaining = (expires_at - datetime.now(timezone.utc)).days
        if days_remaining < 0:
            status = 'critical'
        elif days_remaining <= 14:
            status = 'warning'

    return {
        'status': status,
        'provider_required': False,
        'subject': name_tuple_to_dict(cert.get('subject', [])),
        'issuer': name_tuple_to_dict(cert.get('issuer', [])),
        'not_before': cert.get('notBefore'),
        'not_after': not_after,
        'days_remaining': days_remaining,
        'serial_number': cert.get('serialNumber'),
        'subject_alt_names': [
            value for key, value in cert.get('subjectAltName', []) if key.lower() == 'dns'
        ],
    }


def suggest_typosquats(domain):
    labels = domain.split('.')
    public_suffix_labels = 1
    country_code_suffixes = {'au', 'br', 'ca', 'jp', 'nz', 'uk'}
    second_level_suffixes = {'ac', 'co', 'com', 'edu', 'gov', 'net', 'org'}
    if (
        len(labels) > 2
        and labels[-1] in country_code_suffixes
        and labels[-2] in second_level_suffixes
    ):
        public_suffix_labels = 2
    name = labels[-(public_suffix_labels + 1)]
    suffix = '.'.join(labels[-public_suffix_labels:])
    suggestions = []

    def add(candidate):
        if candidate != name and len(candidate) >= 3:
            fqdn = f'{candidate}.{suffix}'
            if fqdn not in suggestions:
                suggestions.append(fqdn)

    for index in range(len(name)):
        add(name[:index] + name[index + 1:])

    for index in range(len(name) - 1):
        add(name[:index] + name[index + 1] + name[index] + name[index + 2:])

    replacements = {
        'o': '0',
        'i': '1',
        'l': '1',
        'e': '3',
        'a': '4',
        's': '5',
    }
    for index, char in enumerate(name):
        if char in replacements:
            add(name[:index] + replacements[char] + name[index + 1:])

    return {
        'status': 'informational',
        'provider_required': False,
        'suggestions': suggestions[:12],
        'message': 'Generated locally from common omission, adjacent-swap, and lookalike patterns; registration and reputation checks require a provider.',
    }


def query_dns(domain, record_type):
    qtype = DNS_TYPES[record_type]
    nameservers = system_nameservers()
    last_error = None

    for nameserver in nameservers:
        try:
            return dns_udp_query(nameserver, domain, qtype)
        except TimeoutError:
            last_error = TimeoutError('DNS query timed out.')
        except OSError as exc:
            last_error = exc

    if last_error:
        raise last_error
    return []


def system_nameservers():
    nameservers = []
    try:
        with open('/etc/resolv.conf', encoding='utf-8') as resolv:
            for line in resolv:
                parts = line.strip().split()
                if len(parts) >= 2 and parts[0] == 'nameserver':
                    nameservers.append(parts[1])
    except OSError:
        pass
    return nameservers or ['1.1.1.1', '8.8.8.8']


def dns_udp_query(nameserver, domain, qtype):
    txid = random.randint(0, 65535)
    query = build_dns_query(txid, domain, qtype)
    family = socket.AF_INET6 if ':' in nameserver else socket.AF_INET

    with socket.socket(family, socket.SOCK_DGRAM) as sock:
        sock.settimeout(DNS_TIMEOUT_SECONDS)
        sock.sendto(query, (nameserver, 53))
        try:
            data, _ = sock.recvfrom(4096)
        except socket.timeout as exc:
            raise TimeoutError('DNS query timed out.') from exc

    return parse_dns_response(data, txid, qtype)


def build_dns_query(txid, domain, qtype):
    header = struct.pack('!HHHHHH', txid, 0x0100, 1, 0, 0, 0)
    question = b''.join(
        bytes([len(label)]) + label.encode('ascii') for label in domain.split('.')
    )
    return header + question + b'\x00' + struct.pack('!HH', qtype, 1)


def parse_dns_response(data, txid, requested_qtype):
    if len(data) < 12:
        return []

    response_txid, flags, qdcount, ancount, _, _ = struct.unpack('!HHHHHH', data[:12])
    if response_txid != txid or flags & 0x000F == 3:
        return []

    offset = 12
    for _ in range(qdcount):
        _, offset = read_dns_name(data, offset)
        offset += 4

    answers = []
    for _ in range(ancount):
        _, offset = read_dns_name(data, offset)
        if offset + 10 > len(data):
            break
        record_type, record_class, _, rdlength = struct.unpack('!HHIH', data[offset:offset + 10])
        offset += 10
        rdata_offset = offset
        rdata = data[offset:offset + rdlength]
        offset += rdlength

        if record_class != 1 or record_type != requested_qtype:
            continue
        if record_type == DNS_TYPES['A'] and len(rdata) == 4:
            answers.append(socket.inet_ntop(socket.AF_INET, rdata))
        elif record_type == DNS_TYPES['AAAA'] and len(rdata) == 16:
            answers.append(socket.inet_ntop(socket.AF_INET6, rdata))
        elif record_type == DNS_TYPES['MX'] and len(rdata) >= 3:
            preference = struct.unpack('!H', rdata[:2])[0]
            exchange, _ = read_dns_name(data, rdata_offset + 2)
            answers.append(f'{preference} {exchange.rstrip(".")}')
        elif record_type == DNS_TYPES['TXT']:
            txt_parts = []
            txt_offset = 0
            while txt_offset < len(rdata):
                length = rdata[txt_offset]
                txt_offset += 1
                txt_parts.append(rdata[txt_offset:txt_offset + length].decode('utf-8', 'replace'))
                txt_offset += length
            answers.append(''.join(txt_parts))

    return answers


def read_dns_name(data, offset):
    labels = []
    jumped = False
    original_offset = offset
    visited_offsets = set()

    while offset < len(data):
        if offset in visited_offsets:
            break
        visited_offsets.add(offset)
        length = data[offset]
        if length == 0:
            offset += 1
            break
        if length & 0xC0 == 0xC0:
            pointer = ((length & 0x3F) << 8) | data[offset + 1]
            if not jumped:
                original_offset = offset + 2
            offset = pointer
            jumped = True
            continue
        offset += 1
        labels.append(data[offset:offset + length].decode('ascii', 'replace'))
        offset += length

    return '.'.join(labels) + ('.' if labels else ''), (original_offset if jumped else offset)


def parse_cert_datetime(value):
    try:
        return datetime.strptime(value, '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def name_tuple_to_dict(name_tuple):
    result = {}
    for group in name_tuple:
        for key, value in group:
            result[key] = value
    return result


def summarize_status(statuses):
    if 'critical' in statuses:
        return 'critical'
    if 'warning' in statuses:
        return 'warning'
    if statuses and all(status == 'unknown' for status in statuses):
        return 'unknown'
    return 'ok'
