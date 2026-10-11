import asyncio
from typing import Callable, Dict, List, Type, Any, Coroutine
from app.events.events import Event
from app.core.logging import logger

EventHandler = Callable[[Event], Any]

class EventBus:
    def __init__(self):
        self._subscribers: Dict[Type[Event], List[EventHandler]] = {}

    def subscribe(self, event_type: Type[Event], handler: EventHandler):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)

    def publish(self, event: Event):
        handlers = self._subscribers.get(type(event), [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    asyncio.create_task(self._run_async_handler(handler, event))
                else:
                    handler(event)
            except Exception as e:
                logger.error(f"Error handling event {type(event).__name__}: {e}", exc_info=True)

    async def _run_async_handler(self, handler: EventHandler, event: Event):
        try:
            await handler(event)
        except Exception as e:
            logger.error(f"Error handling async event {type(event).__name__}: {e}", exc_info=True)

event_bus = EventBus()
