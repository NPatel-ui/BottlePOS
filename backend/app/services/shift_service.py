from decimal import Decimal
from typing import List
from app.domain.shifts import Shift, ShiftStatus, CashDrawerEvent, CashDrawerEventType
from app.schemas.shifts import ShiftOpenRequest, ShiftCloseRequest
from app.repositories.memory.shifts import ShiftRepository, CashDrawerEventRepository
from app.core.exceptions import NotFoundException, BusinessRuleException
from app.domain.common import utc_now

class ShiftService:
    def __init__(self, shift_repo: ShiftRepository, cash_drawer_repo: CashDrawerEventRepository):
        self.shift_repo = shift_repo
        self.cash_drawer_repo = cash_drawer_repo

    def open_shift(self, organization_id: str, store_id: str, request: ShiftOpenRequest) -> Shift:
        existing_shifts = self.shift_repo.list(
            organization_id=organization_id, 
            store_id=store_id, 
            employee_id=request.employee_id, 
            status=ShiftStatus.OPEN
        )
        if existing_shifts:
            raise BusinessRuleException("Employee already has an open shift")

        shift = Shift(
            organization_id=organization_id,
            store_id=store_id,
            employee_id=request.employee_id,
            opening_cash=request.opening_cash
        )
        self.shift_repo.create(shift)
        
        event = CashDrawerEvent(
            organization_id=organization_id,
            store_id=store_id,
            shift_id=shift.id,
            employee_id=request.employee_id,
            event_type=CashDrawerEventType.OPEN_SHIFT,
            amount=request.opening_cash
        )
        self.cash_drawer_repo.create(event)
        
        return shift

    def get_shift(self, shift_id: str) -> Shift:
        shift = self.shift_repo.get(shift_id)
        if not shift:
            raise NotFoundException("Shift", shift_id)
        return shift

    def calculate_expected_cash(self, shift_id: str) -> Decimal:
        shift = self.get_shift(shift_id)
        events = self.cash_drawer_repo.list(shift_id=shift_id)
        
        expected_cash = Decimal("0.00")
        for event in events:
            if event.event_type in [CashDrawerEventType.OPEN_SHIFT, CashDrawerEventType.CASH_SALE]:
                expected_cash += event.amount
            elif event.event_type in [CashDrawerEventType.CASH_REFUND, CashDrawerEventType.PAID_OUT, CashDrawerEventType.CASH_DROP]:
                expected_cash -= event.amount
                
        return expected_cash

    def close_shift(self, shift_id: str, request: ShiftCloseRequest) -> Shift:
        shift = self.get_shift(shift_id)
        if shift.status != ShiftStatus.OPEN:
            raise BusinessRuleException("Shift is already closed")

        expected_cash = self.calculate_expected_cash(shift_id)
        
        shift.closing_cash = request.closing_cash
        shift.expected_cash = expected_cash
        shift.cash_variance = request.closing_cash - expected_cash
        shift.status = ShiftStatus.CLOSED
        shift.closed_at = utc_now()
        
        self.shift_repo.update(shift)
        
        event = CashDrawerEvent(
            organization_id=shift.organization_id,
            store_id=shift.store_id,
            shift_id=shift.id,
            employee_id=shift.employee_id,
            event_type=CashDrawerEventType.CLOSE_SHIFT,
            amount=request.closing_cash
        )
        self.cash_drawer_repo.create(event)
        
        from app.events.bus import event_bus
        from app.events.events import ShiftClosedEvent, CashVarianceDetectedEvent
        from app.core.ids import generate_id
        
        event_bus.publish(ShiftClosedEvent(
            event_id=generate_id(),
            timestamp=utc_now(),
            organization_id=shift.organization_id,
            store_id=shift.store_id,
            employee_id=shift.employee_id,
            shift_id=shift.id,
            closing_cash=shift.closing_cash,
            expected_cash=shift.expected_cash,
            variance_amount=shift.cash_variance
        ))
        
        if shift.cash_variance != Decimal("0.00"):
            event_bus.publish(CashVarianceDetectedEvent(
                event_id=generate_id(),
                timestamp=utc_now(),
                organization_id=shift.organization_id,
                store_id=shift.store_id,
                employee_id=shift.employee_id,
                shift_id=shift.id,
                variance_amount=shift.cash_variance
            ))
        
        return shift

    def add_cash_drawer_event(self, organization_id: str, store_id: str, shift_id: str, employee_id: str, event_type: CashDrawerEventType, amount: Decimal) -> CashDrawerEvent:
        event = CashDrawerEvent(
            organization_id=organization_id,
            store_id=store_id,
            shift_id=shift_id,
            employee_id=employee_id,
            event_type=event_type,
            amount=amount
        )
        return self.cash_drawer_repo.create(event)
