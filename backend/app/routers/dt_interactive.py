"""
Decision Tree Interactive Builder

Provides a single endpoint that builds a complete decision tree
and returns all splits, steps, and tree structure for frontend animation.
"""

from fastapi import APIRouter, Query
import random

router = APIRouter(prefix="/dt-interactive", tags=["dt"])
NC = 4
FN = ["X1", "X2"]


def _blob(rng, cx, cy, sp, lab, n):
    """Generate a blob of points for a class."""
    return [([rng.gauss(cx, sp), rng.gauss(cy, sp)], lab) for _ in range(n)]


def make_dataset(name):
    """Create synthetic datasets: quadrants, stripes, corners."""
    rng = random.Random(42)
    p = []
    if name == "stripes":
        for i, l in enumerate([0, 1, 2, 3]):
            p += _blob(rng, 1.25 + i * 2.5, 5, 0.7, l, 30)
    elif name == "corners":
        p += _blob(rng, 2, 8, 1.2, 0, 30)
        p += _blob(rng, 8, 8, 1.2, 1, 30)
        p += _blob(rng, 5, 5, 1.0, 2, 30)
        p += _blob(rng, 5, 2, 1.2, 3, 30)
    else:  # quadrants
        p += _blob(rng, 2.5, 7.5, 0.9, 0, 30)
        p += _blob(rng, 7.5, 7.5, 0.9, 1, 30)
        p += _blob(rng, 2.5, 2.5, 0.9, 2, 30)
        p += _blob(rng, 7.5, 2.5, 0.9, 3, 30)
    rng.shuffle(p)
    return [a for a, _ in p], [b for _, b in p]


def counts(ys):
    """Count class occurrences."""
    c = [0] * NC
    for v in ys:
        c[v] += 1
    return c


def gini(ys):
    """Compute Gini impurity."""
    n = len(ys)
    if not n:
        return 0.0
    return 1 - sum((c / n) ** 2 for c in counts(ys))


def majority(ys):
    """Get majority class."""
    c = counts(ys)
    return c.index(max(c))


def best_split(X, y):
    """Find best split over both features; return (feature, threshold, gain, weighted_gini) and top 3 candidates."""
    n = len(y)
    par = gini(y)
    best = None
    cand = []
    for f in range(2):
        vals = sorted(set(r[f] for r in X))
        for i in range(len(vals) - 1):
            t = (vals[i] + vals[i + 1]) / 2
            ly = [y[j] for j in range(n) if X[j][f] <= t]
            ry = [y[j] for j in range(n) if X[j][f] > t]
            if not ly or not ry:
                continue
            w = len(ly) / n * gini(ly) + len(ry) / n * gini(ry)
            g = par - w
            cand.append((f, t, g, w))
            if best is None or g > best[2]:
                best = (f, t, g, w)
    cand.sort(key=lambda c: -c[2])
    return best, cand[:3]


def build(X, y, max_depth=4, min_split=4):
    """Build tree BFS; return nodes dict and steps list."""
    nodes = {}
    steps = []
    cid = [0]

    def mk(idx, d, bd):
        """Create a leaf node."""
        i = cid[0]
        cid[0] += 1
        ys = [y[j] for j in idx]
        nodes[i] = {
            "id": i,
            "depth": d,
            "gini": round(gini(ys), 3),
            "n_samples": len(idx),
            "predicted_class": majority(ys),
            "is_leaf": True,
            "feature": None,
            "feature_name": None,
            "threshold": None,
            "left_id": None,
            "right_id": None,
            "bounds": bd,
        }
        return i

    # Root bounds
    xs = [r[0] for r in X]
    ys = [r[1] for r in X]
    rb = {
        "x_min": round(min(xs) - 0.5, 2),
        "x_max": round(max(xs) + 0.5, 2),
        "y_min": round(min(ys) - 0.5, 2),
        "y_max": round(max(ys) + 0.5, 2),
    }
    root = mk(list(range(len(y))), 0, rb)
    q = [(root, list(range(len(y))))]

    # BFS split
    while q:
        nid, idx = q.pop(0)
        nd = nodes[nid]
        yy = [y[j] for j in idx]

        if nd["depth"] >= max_depth or len(idx) < min_split:
            continue

        bs, cand = best_split([X[j] for j in idx], yy)
        if not bs:
            continue

        f, t, g, w = bs
        li = [idx[j] for j in range(len(idx)) if X[idx[j]][f] <= t]
        ri = [idx[j] for j in range(len(idx)) if X[idx[j]][f] > t]

        # Split bounds
        q_left = dict(nd["bounds"])
        q_right = dict(nd["bounds"])
        if f == 0:
            q_left["x_max"] = round(t, 2)
            q_right["x_min"] = round(t, 2)
        else:
            q_left["y_max"] = round(t, 2)
            q_right["y_min"] = round(t, 2)

        l = mk(li, nd["depth"] + 1, q_left)
        r = mk(ri, nd["depth"] + 1, q_right)
        nd.update(
            is_leaf=False,
            feature=f,
            feature_name=FN[f],
            threshold=round(t, 2),
            left_id=l,
            right_id=r,
        )

        steps.append(
            {
                "node_id": nid,
                "feature": f,
                "feature_name": FN[f],
                "threshold": round(t, 2),
                "gini_before": round(gini(yy), 3),
                "gini_after": round(w, 3),
                "gain": round(g, 3),
                "n_samples": len(idx),
                "left_id": l,
                "right_id": r,
                "candidates": [
                    {
                        "feature_name": FN[c[0]],
                        "threshold": round(c[1], 2),
                        "gain": round(c[2], 3),
                    }
                    for c in cand
                ],
            }
        )
        q += [(l, li), (r, ri)]

    return nodes, steps


@router.get("")
def get_tree(dataset: str = Query("quadrants")):
    """Build and return complete tree with animation steps."""
    X, y = make_dataset(dataset)
    nodes, steps = build(X, y)
    return {
        "root_id": 0,
        "total_steps": len(steps),
        "points": [
            {"x": round(X[i][0], 2), "y": round(X[i][1], 2), "label": y[i]}
            for i in range(len(y))
        ],
        "steps": steps,
        "tree": {str(k): v for k, v in nodes.items()},
    }
