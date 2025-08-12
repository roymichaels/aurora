# Hypnosis Scripts

The `HypnosisAgent` assembles hypnotic guidance in **five phases**:

1. **Preparation** – sets context and pacing so the user can settle in.
2. **Induction** – guides slow breathing to begin relaxation.
3. **Deepening** – counts down or uses imagery to drift further inward.
4. **Suggestion** – mode‑specific affirmations and goal visualization with a positive anchor.
5. **Awakening** – returns the listener to alertness while preserving the anchor.

Optional parameters let the caller shape pacing or focus:

- `duration`: approximate length of the session in seconds.
- `mode`: focus of the script such as `"calm"`, `"confidence"`, `"focus"`, or `"reset"`.

## Example

```python
from agents.hypnosis import HypnosisAgent

text = HypnosisAgent.generate(
    "It's a quiet evening.",
    "crush tomorrow's presentation",
    duration=90,
    mode="confidence",
)
print(text)
```

Sample output:

```
Preparation:
This session lasts about 90 seconds. It's a quiet evening. Allow yourself to get comfortable.

Induction:
Close your eyes and take slow, deep breaths, letting tension melt away.

Deepening:
With each count from ten down to one, you feel twice as relaxed, drifting deeper.

Suggestion:
As you rest, a steady confidence fills you with each breath. Visualize crush tomorrow's presentation as already unfolding perfectly. Whenever you press your thumb and forefinger together, this feeling returns.

Awakening:
Take a final deep breath, gently wiggle your fingers, and open your eyes, bringing this feeling back with you.
```
