import re
import html


# Inline patterns applied left-to-right
_INLINE_RULES = [
    # Named link: [label ""url""]
    (re.compile(r'\[(.+?)\s+""{2}(.+?)""\]'), r'<a href="\2">\1</a>'),
    # Bare link: [""url""]
    (re.compile(r'\[""{2}(.+?)""\]'), r'<a href="\1">\1</a>'),
    # Bold
    (re.compile(r'\*\*(.+?)\*\*'), r'<strong>\1</strong>'),
    # Italic
    (re.compile(r'//(.+?)//'), r'<em>\1</em>'),
    # Underline
    (re.compile(r'__(.+?)__'), r'<u>\1</u>'),
    # Strikethrough
    (re.compile(r'--(.+?)--'), r'<del>\1</del>'),
    # Inline verbatim/monospace: ''text''
    (re.compile(r"''(.+?)''"), r'<code>\1</code>'),
    # Line break
    (re.compile(r'\\\\$'), '<br>'),
]

_HASHTAG_RE = re.compile(r'(?<![&\w#])(#|\uff03)([^\W\d_]\w*)', re.IGNORECASE)
_DATE_REF_RE = re.compile(r'\[(\d{4}-\d{2}-\d{2})\]')


def _apply_inline(text: str) -> str:
    """Apply inline markup rules to a line of text."""
    # Escape HTML first, but carefully - we need to unescape for links
    # Instead, process rules on raw text then escape remainder
    result = text
    for pattern, replacement in _INLINE_RULES:
        result = pattern.sub(replacement, result)
    # Hashtags
    result = _HASHTAG_RE.sub(r'<span class="hashtag">\1\2</span>', result)
    # Date references
    result = _DATE_REF_RE.sub(r'<a href="#" class="date-ref" data-date="\1">\1</a>', result)
    return result


def _heading_level(line: str):
    """Return (level, title) if line is a heading, else None."""
    m = re.match(r'^(={1,5})\s+(.+?)\s+\1\s*$', line)
    if m:
        return len(m.group(1)), m.group(2)
    return None


def _list_info(line: str):
    """Return (indent, list_type, content) for list lines, else None."""
    m = re.match(r'^(\s*)([-+])\s(.+)$', line)
    if m:
        indent = len(m.group(1))
        ltype = 'ul' if m.group(2) == '-' else 'ol'
        return indent, ltype, m.group(3)
    return None


def convert_to_html(text: str) -> str:
    """Convert txt2tags markup (RedNotebook flavor) to HTML."""
    lines = text.split('\n')
    out = []
    in_code = False
    # list_stack: list of (indent, tag) for open list elements
    list_stack: list[tuple[int, str]] = []
    para_lines: list[str] = []

    def flush_para():
        if para_lines:
            content = ' '.join(para_lines)
            out.append(f'<p>{_apply_inline(content)}</p>')
            para_lines.clear()

    def close_lists_to(target_indent: int):
        while list_stack and list_stack[-1][0] >= target_indent:
            _, tag = list_stack.pop()
            out.append(f'</{tag}>')

    def close_all_lists():
        while list_stack:
            _, tag = list_stack.pop()
            out.append(f'</{tag}>')

    for line in lines:
        # --- Code block fence ---
        if line.strip() == '```':
            if in_code:
                out.append('</code></pre>')
                in_code = False
            else:
                flush_para()
                close_all_lists()
                out.append('<pre><code>')
                in_code = True
            continue

        if in_code:
            out.append(html.escape(line))
            continue

        # --- Comment lines ---
        if line.startswith('%'):
            continue

        # --- Empty line ---
        if not line.strip():
            flush_para()
            close_all_lists()
            out.append('<br>')
            continue

        # --- Horizontal rule ---
        if re.match(r'^-{4,}$', line.strip()):
            flush_para()
            close_all_lists()
            out.append('<hr>')
            continue

        # --- Heading ---
        heading = _heading_level(line)
        if heading:
            flush_para()
            close_all_lists()
            level, title = heading
            out.append(f'<h{level}>{_apply_inline(title)}</h{level}>')
            continue

        # --- List item ---
        li = _list_info(line)
        if li:
            flush_para()
            indent, ltype, content = li

            if not list_stack:
                out.append(f'<{ltype}>')
                list_stack.append((indent, ltype))
            else:
                cur_indent, cur_type = list_stack[-1]
                if indent > cur_indent:
                    out.append(f'<{ltype}>')
                    list_stack.append((indent, ltype))
                elif indent < cur_indent:
                    close_lists_to(indent)
                    if not list_stack or list_stack[-1][0] != indent:
                        out.append(f'<{ltype}>')
                        list_stack.append((indent, ltype))

            out.append(f'<li>{_apply_inline(content)}</li>')
            continue

        # --- Regular text ---
        close_all_lists()
        para_lines.append(line)

    flush_para()
    close_all_lists()
    if in_code:
        out.append('</code></pre>')

    return '\n'.join(out)
