# Hypnosis Scripts

The `HypnosisAgent` assembles hypnotic guidance in **seven phases**:

1. **Preparation** – sets context and pacing so the user can settle in.
2. **Induction** – guides slow breathing to begin relaxation.
3. **Deepening** – counts down or uses imagery to drift further inward.
4. **Visualization** – paints a vivid, sensory picture of the desired outcome.
5. **Suggestion** – mode‑specific affirmations that reinforce the goal.
6. **Anchoring** – links the feeling to a physical cue and mental phrase.
7. **Awakening** – returns the listener to alertness while preserving the anchor.

Optional parameters let the caller shape pacing or focus:

- `duration`: approximate length of the session in seconds.
- `mode`: focus of the script such as `"calm"`, `"confidence"`, `"focus"`, or `"reset"`.
- `anchor_cue`: physical gesture like *"touch thumb and index finger"*.
- `anchor_phrase`: mental phrase to silently repeat.

## Example

```python
from agents.hypnosis import HypnosisAgent

text = HypnosisAgent.generate(
    "It's a quiet evening.",
    "crush tomorrow's presentation",
    duration=90,
    mode="confidence",
    anchor_cue="touch thumb and index finger",
    anchor_phrase="I've got this",
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

Visualization:
Picture crush tomorrow's presentation in vivid, sensory detail, as if it is happening now.

Suggestion:
As you rest, a steady confidence fills you with each breath.

Anchoring:
Whenever you touch thumb and index finger, let the phrase 'I've got this' echo in your mind, and this vivid image and feeling return effortlessly.

Awakening:
Take a final deep breath, gently wiggle your fingers, and open your eyes, bringing this feeling back with you.
```
