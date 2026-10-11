from typing import TypeVar, Generic, List, Optional, Any, Type
from dataclasses import is_dataclass, asdict
from decimal import Decimal
from datetime import datetime
import json
from app.core.supabase import get_supabase_client

T = TypeVar("T")

class SupabaseBaseRepository(Generic[T]):
    def __init__(self, table_name: str, entity_cls: Type[T]):
        self.table_name = table_name
        self.entity_cls = entity_cls

    @property
    def client(self):
        return get_supabase_client()

    def _serialize_value(self, val: Any) -> Any:
        if isinstance(val, Decimal):
            return float(val)
        if isinstance(val, datetime):
            return val.isoformat()
        if hasattr(val, "value"):  # Enum support
            return val.value
        if isinstance(val, list):
            return [self._serialize_value(item) for item in val]
        if isinstance(val, dict):
            return {k: self._serialize_value(v) for k, v in val.items()}
        return val

    def _to_record(self, entity: T) -> dict:
        if is_dataclass(entity):
            raw = asdict(entity)
        elif hasattr(entity, "model_dump"):
            raw = entity.model_dump()
        elif isinstance(entity, dict):
            raw = entity.copy()
        else:
            raw = entity.__dict__.copy()

        return {k: self._serialize_value(v) for k, v in raw.items()}

    def _from_record(self, record: dict) -> T:
        if not record:
            return None
        # Convert numeric fields or datetime strings if entity class expects it
        try:
            return self.entity_cls(**record)
        except Exception:
            # If extra fields from joined tables, filter to known dataclass fields
            if is_dataclass(self.entity_cls):
                field_names = self.entity_cls.__dataclass_fields__.keys()
                filtered = {k: v for k, v in record.items() if k in field_names}
                return self.entity_cls(**filtered)
            return self.entity_cls(**record)

    def get(self, id: str) -> Optional[T]:
        client = self.client
        if not client:
            return None
        res = client.table(self.table_name).select("*").eq("id", id).execute()
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return None

    def list(self, skip: int = 0, limit: int = 100, **filters: Any) -> List[T]:
        client = self.client
        if not client:
            return []
        query = client.table(self.table_name).select("*")
        for key, value in filters.items():
            if value is not None:
                query = query.eq(key, self._serialize_value(value))
        res = query.range(skip, skip + limit - 1).execute()
        return [self._from_record(r) for r in (res.data or [])]

    def create(self, entity: T) -> T:
        client = self.client
        if not client:
            raise RuntimeError("Supabase client is not configured")
        record = self._to_record(entity)
        res = client.table(self.table_name).insert(record).execute()
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return entity

    def update(self, entity: T) -> T:
        client = self.client
        if not client:
            raise RuntimeError("Supabase client is not configured")
        record = self._to_record(entity)
        entity_id = record.get("id")
        if not entity_id:
            raise ValueError("Entity must have an id to update")
        res = client.table(self.table_name).update(record).eq("id", entity_id).execute()
        if res.data and len(res.data) > 0:
            return self._from_record(res.data[0])
        return entity

    def delete(self, id: str) -> bool:
        client = self.client
        if not client:
            return False
        res = client.table(self.table_name).delete().eq("id", id).execute()
        return bool(res.data)
