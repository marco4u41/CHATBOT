from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class FollowupField:
    """Declares a piece of information a capability needs to work optimally.

    Attributes:
        name: Short key matching a CapabilityContext field (e.g. ``"budget"``).
        question: Natural-language question the LLM should adapt.  Written in
            imperative/subjunctive Spanish so the model can rephrase fluently.
        priority: 1 = critical (response quality degrades heavily without it),
            2 = important (noticeable improvement), 3 = nice-to-have.
    """

    name: str
    question: str
    priority: int
