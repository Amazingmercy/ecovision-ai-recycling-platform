import os
import re

TEMPLATES_DIR = os.path.dirname(os.path.abspath(__file__))
LAYOUT_FILE = os.path.join(TEMPLATES_DIR, "index_layout.html")
INDEX_FILE = os.path.join(TEMPLATES_DIR, "index.html")

def render_index_html() -> str:
    """
    Assembles the modular HTML components into the full page:
      - components/navbar.html
      - components/user_sidebar.html
      - views/home_view.html
      - views/scan_view.html
      - views/dashboard_view.html
      - views/history_view.html
      - components/modals.html
    """

    if not os.path.exists(LAYOUT_FILE):
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, "r", encoding="utf-8") as f:
                return f.read()
        return "<h1>Template layout missing</h1>"

    with open(LAYOUT_FILE, "r", encoding="utf-8") as f:
        layout = f.read()

    def replace_include(match):
        rel_path = match.group(1).strip()
        full_path = os.path.join(TEMPLATES_DIR, rel_path.replace("/", os.sep))
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as inc_file:
                return inc_file.read()
        return f"<!-- Missing modular component: {rel_path} -->"

    pattern = r"\{%\s*include\s+['\"]([^'\"]+)['\"]\s*%\}"
    assembled = re.sub(pattern, replace_include, layout)

    # Persist assembled copy to index.html for static tools & FileResponse
    try:
        with open(INDEX_FILE, "w", encoding="utf-8", newline="\n") as out:
            out.write(assembled)
    except Exception as e:
        print(f"[TemplateManager] Warning writing compiled index.html: {e}")

    return assembled


def compile_index_html():
    """Compiles modular templates into index.html."""
    return render_index_html()


if __name__ == "__main__":
    content = compile_index_html()
    print(f"Compiled index.html ({len(content)} chars)")
