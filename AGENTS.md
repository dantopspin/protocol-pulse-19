<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Calculator is a globally mounted sheet controlled by AppShell's context, not a route; this keeps it accessible from header utilities and contextual calculation buttons without leaving the current screen.

Vial-label scanning is a globally mounted sheet; it sends a resized image to a server-only AI Gateway helper and saves only explicitly reviewed label fields into local inventory, never the image, to prevent inferred strength from becoming a dose or inventory amount.
