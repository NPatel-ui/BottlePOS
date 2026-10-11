import pytest
import asyncio
from datetime import datetime
from app.events.bus import EventBus
from app.events.events import Event

class DummyEvent(Event):
    pass

@pytest.mark.asyncio
async def test_event_bus_sync_handler():
    bus = EventBus()
    handled = []
    
    def sync_handler(event):
        handled.append(event)
        
    bus.subscribe(DummyEvent, sync_handler)
    
    event = DummyEvent(
        event_id="1", timestamp=datetime.now(), 
        organization_id="o1", store_id="s1", employee_id="e1"
    )
    
    bus.publish(event)
    assert len(handled) == 1
    assert handled[0] == event

@pytest.mark.asyncio
async def test_event_bus_async_handler():
    bus = EventBus()
    handled = []
    
    async def async_handler(event):
        handled.append(event)
        
    bus.subscribe(DummyEvent, async_handler)
    
    event = DummyEvent(
        event_id="1", timestamp=datetime.now(), 
        organization_id="o1", store_id="s1", employee_id="e1"
    )
    
    bus.publish(event)
    
    # Yield to event loop so task runs
    await asyncio.sleep(0.01)
    
    assert len(handled) == 1
    assert handled[0] == event
