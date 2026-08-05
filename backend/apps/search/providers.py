import os
from dataclasses import dataclass


@dataclass(frozen=True)
class SearchProviderResult:
    results: list
    live: bool
    provider_required: bool
    message: str
    source: str
    took: float = 0.0

    @property
    def total(self):
        return len(self.results)


class BaseThreatIntelProvider:
    source = 'internal'

    def configured(self):
        return False

    def search(self, query, search_type):
        return SearchProviderResult(
            results=[],
            live=False,
            provider_required=True,
            message='No threat intelligence provider is configured for this environment.',
            source=self.source,
        )


class EmptyThreatIntelProvider(BaseThreatIntelProvider):
    source = 'internal'


class HibpProvider(BaseThreatIntelProvider):
    source = 'hibp'

    def configured(self):
        return bool(os.environ.get('HIBP_API_KEY'))

    def search(self, query, search_type):
        return SearchProviderResult(
            results=[],
            live=False,
            provider_required=True,
            message='HIBP_API_KEY is configured, but the live HIBP adapter is not enabled yet.',
            source=self.source,
        )


class DehashedProvider(BaseThreatIntelProvider):
    source = 'dehashed'

    def configured(self):
        return bool(os.environ.get('DEHASHED_API_KEY'))

    def search(self, query, search_type):
        return SearchProviderResult(
            results=[],
            live=False,
            provider_required=True,
            message='DEHASHED_API_KEY is configured, but the live DeHashed adapter is not enabled yet.',
            source=self.source,
        )


class IntelxProvider(BaseThreatIntelProvider):
    source = 'intelx'

    def configured(self):
        return bool(os.environ.get('INTELX_API_KEY'))

    def search(self, query, search_type):
        return SearchProviderResult(
            results=[],
            live=False,
            provider_required=True,
            message='INTELX_API_KEY is configured, but the live Intelligence X adapter is not enabled yet.',
            source=self.source,
        )


PROVIDERS = {
    'hibp': HibpProvider(),
    'dehashed': DehashedProvider(),
    'intelx': IntelxProvider(),
    'internal': EmptyThreatIntelProvider(),
}


def get_provider(source):
    provider = PROVIDERS.get(source) or PROVIDERS['internal']
    if provider.configured():
        return provider
    return PROVIDERS['internal']
