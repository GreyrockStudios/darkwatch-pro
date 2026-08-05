from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import SearchResult
from .providers import get_provider
from .serializers import SearchResultSerializer


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def _run_search(self, request, query, search_type, source):
        provider_result = get_provider(source).search(query, search_type)
        with transaction.atomic():
            user = type(request.user).objects.select_for_update().get(pk=request.user.pk)
            if user.credits < 1:
                return Response(
                    {'error': 'No search credits remaining', 'balance': user.credits},
                    status=status.HTTP_402_PAYMENT_REQUIRED,
                )

            user.credits -= 1
            user.save(update_fields=['credits'])
            request.user.credits = user.credits
            balance = user.credits

            result = SearchResult.objects.create(
                user=user,
                query=query,
                type=search_type,
                source=provider_result.source,
                data={
                    'query': query,
                    'results': provider_result.results,
                    'total': provider_result.total,
                    'balance': balance,
                    'took': provider_result.took,
                    'live': provider_result.live,
                    'provider_required': provider_result.provider_required,
                    'message': provider_result.message,
                },
            )

        return Response({
            'id': str(result.id),
            'query': query,
            'type': search_type,
            'results': provider_result.results,
            'total': provider_result.total,
            'balance': balance,
            'took': provider_result.took,
            'live': provider_result.live,
            'provider_required': provider_result.provider_required,
            'message': provider_result.message,
        })

    def get(self, request):
        """GET /search/?q=query — convenience alias for POST search."""
        query = request.query_params.get('q', '') or request.query_params.get('query', '')
        search_type = request.query_params.get('type', 'email')
        source = request.query_params.get('source', 'dehashed')

        if not query:
            return Response({'error': 'Query parameter q or query is required'}, status=status.HTTP_400_BAD_REQUEST)

        return self._run_search(request, query, search_type, source)

    def post(self, request):
        query = request.data.get('query', '')
        search_type = request.data.get('type', 'email')
        source = request.data.get('source', 'dehashed')

        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)

        return self._run_search(request, query, search_type, source)


class SearchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = SearchResult.objects.filter(user=request.user)[:50]
        serializer = SearchResultSerializer(results, many=True)
        return Response(serializer.data)
