import subprocess
import json
import importlib.util
from pathlib import Path


spec = importlib.util.spec_from_file_location(
    "prompt", Path(__file__).resolve().parents[1] / "core" / "prompt.py"
)
prompt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prompt)
build_prompt = prompt.build_prompt


def run_js_builder(persona, memories, behavior_style, skills, filters):
    script = (
        "import { buildPrompt } from './core/prompt.js';\n"
        f"console.log(buildPrompt({json.dumps(persona)}, {json.dumps(memories)}, {json.dumps(behavior_style)}, {json.dumps(skills)}, {json.dumps(filters)}));"
    )
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def test_prompt_builder_matches_js():
    persona = "Confident coder"
    memories = ["Finished project", "Won hackathon"]
    behavior_style = "supportive"
    skills = ["coding", "debugging"]
    filters = ["sarcasm"]

    py_prompt = build_prompt(persona, memories, behavior_style, skills, filters)
    js_prompt = run_js_builder(persona, memories, behavior_style, skills, filters)

    assert py_prompt == js_prompt
