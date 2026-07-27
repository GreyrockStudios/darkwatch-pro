from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket, TicketMessage
from .serializers import TicketSerializer, TicketDetailSerializer, TicketMessageSerializer


class TicketViewSet(viewsets.ModelViewSet):
    """ViewSet for support tickets."""

    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ticket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(ticket=ticket, sender=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)