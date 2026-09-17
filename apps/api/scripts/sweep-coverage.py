"""Return anchors that were set aside only because a model call hit a quota.

A batch log says "rewrite skipped" (or a repair round that never ran) next to
a quota error and then "<slug>: no rewrite returned; dropping the problem".
The draft was judge-verified; only its statement rewrite or repair was
missing. Deleting the coverage entry lets a later batch draft the anchor
again. Rejections with another reason ("unknown signature", "mentions a
problem site") are left alone.

    python scripts/sweep-coverage.py [--apply]
"""
import json, re, sys, glob, os

apply = '--apply' in sys.argv
cov_path = os.path.join('src', 'corpus', 'coverage.json')
cov = json.load(open(cov_path, encoding='utf-8'))

returned = []
for log in glob.glob(os.path.join('scripts', 'author-out', 'gen-lc-*.log')):
    batch = os.path.basename(log)[:-4]
    text = open(log, encoding='utf-8', errors='replace').read()
    if 'quota' not in text.lower():
        continue
    ours_to_anchor = dict(re.findall(r'^    \+ ([a-z0-9-]+)\s+\S+\s+<- ([a-z0-9-]+)', text, re.M))
    dropped = re.findall(r'^    ! ([a-z0-9-]+): no rewrite returned', text, re.M)
    for ours in dropped:
        anchor = ours_to_anchor.get(ours)
        entry = cov.get(anchor) if anchor else None
        if entry and entry.get('ours') is None and entry.get('batch') == batch:
            returned.append((anchor, batch))
            if apply:
                del cov[anchor]

for a, b in sorted(returned):
    print(f'{a}  ({b})')
print(f'{len(returned)} anchor(s) {"returned" if apply else "would be returned"}')
if apply and returned:
    with open(cov_path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(cov, f, indent=2)
        f.write('\n')
