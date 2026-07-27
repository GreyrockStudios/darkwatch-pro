from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import SearchResult
from .serializers import SearchResultSerializer


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /search/?q=query — convenience alias for POST search."""
        query = request.query_params.get('q', '') or request.query_params.get('query', '')
        search_type = request.query_params.get('type', 'email')
        source = request.query_params.get('source', 'dehashed')

        if not query:
            return Response({'error': 'Query parameter q or query is required'}, status=status.HTTP_400_BAD_REQUEST)

        result = SearchResult.objects.create(
            user=request.user,
            query=query,
            type=search_type,
            source=source,
            data={'query': query, 'results': [], 'total': 0, 'balance': request.user.credits, 'took': 0.15}
        )

        return Response({
            'id': str(result.id),
            'query': query,
            'type': search_type,
            'results': [],
            'total': 0,
            'balance': request.user.credits - 1,
            'took': 0.15,
        })

    def post(self, request):
        query = request.data.get('query', '')
        search_type = request.data.get('type', 'email')
        source = request.data.get('source', 'dehashed')

        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Store the search query
        result = SearchResult.objects.create(
            user=request.user,
            query=query,
            type=search_type,
            source=source,
            data={
                'query': query,
                'results': [],
                'total': 0,
                'balance': request.user.credits,
                'took': 0.15,
            }
        )

        # Return mock data structure (ready for real API integration)
        mock_data = {
            'id': str(result.id),
            'query': query,
            'type': search_type,
            'results': [],
            'total': 0,
            'balance': request.user.credits - 1,
            'took': 0.15,
        }

        return Response(mock_data)


class SearchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = SearchResult.objects.filter(user=request.user)[:50]
        serializer = SearchResultSerializer(results, many=True)
        return Response(serializer.data)