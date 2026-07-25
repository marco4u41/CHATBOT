from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATES_DIR = Path(__file__).parent / "templates"

_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape([]),
    trim_blocks=True,
    lstrip_blocks=True,
)


def _format_number(value: float | int) -> str:
    return f"{value:,.0f}"


_jinja_env.filters["format_number"] = _format_number


def render_prompt(template_name: str, **kwargs: object) -> str:
    template = _jinja_env.get_template(f"{template_name}.txt")
    return template.render(**kwargs)
