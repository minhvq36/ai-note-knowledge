"""
BLOCK COMMENT:
High-performance Policy Pattern.
Pre-calculates dictionaries to avoid overhead during request handling.
Supports 4 scopes: user, tenant, ip, global.
"""
from dataclasses import dataclass, asdict
from typing import Any, Dict

@dataclass(frozen=True)
class RatePolicy:
    capacity: int
    refill_rate: float
    scope: str = "user"
    ttl: int = 120

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert frozen RatePolicy to dict for FastAPI Depends
        """
        return asdict(self)

    def override(self, **kwargs) -> Dict[str, Any]:
        """
        Override specific attributes.
        Only use for outliers; standard policies should be pre-calculated.
        """
        return {**self.to_dict(), **kwargs}

class Policy:
    """
    Pre-calculated dictionaries for all standard scopes.
    Can be imported directly into Depends(rate_limit(**Policy.X)).
    """

    # -------------------------
    # RAW objects (for reference)
    # -------------------------
    _USER_STD = RatePolicy(capacity=20, refill_rate=2.0, scope="user")
    _TENANT_STD = RatePolicy(capacity=500, refill_rate=5.0, scope="tenant")
    _IP_STD = RatePolicy(capacity=100, refill_rate=5.0, scope="ip")
    _GLOBAL_STD = RatePolicy(capacity=1000, refill_rate=10.0, scope="global")

    # -------------------------
    # PRE-CALCULATED DICTS (for Depends)
    # -------------------------
    USER_STANDARD = _USER_STD.to_dict()
    TENANT_STANDARD = _TENANT_STD.to_dict()
    IP_STANDARD = _IP_STD.to_dict()
    GLOBAL_STANDARD = _GLOBAL_STD.to_dict()

    # -------------------------
    # SPECIAL CASES / OVERRIDE EXAMPLES
    # -------------------------
    # User-specific: relaxed search endpoint
    USER_SEARCH_RELAXED = _USER_STD.override(capacity=100)

    # Tenant-specific: heavy write endpoint
    TENANT_HEAVY_WRITE = _TENANT_STD.override(capacity=5, refill_rate=0.1)

    # IP-specific: temporary burst allowance
    IP_BURST = _IP_STD.override(capacity=500, refill_rate=50)

    # Global-wide: rare administrative operations
    GLOBAL_ADMIN = _GLOBAL_STD.override(capacity=2000, refill_rate=20)