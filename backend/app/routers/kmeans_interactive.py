"""
K-Means Interactive Training

Provides a single endpoint that runs full K-Means training once and returns
all steps for frontend animation (no per-step requests).
"""

from fastapi import APIRouter, Query
import random
import math

router = APIRouter(prefix="/kmeans-interactive", tags=["kmeans"])


def _blob(rng, cx, cy, sp, n):
    """Generate a blob of points."""
    return [[rng.gauss(cx, sp), rng.gauss(cy, sp)] for _ in range(n)]


def make_dataset(name):
    """Create synthetic datasets."""
    rng = random.Random(42)
    p = []
    if name == "blobs4":
        p += _blob(rng, 2.5, 2.5, 0.6, 30)
        p += _blob(rng, 7.5, 2.5, 0.6, 30)
        p += _blob(rng, 2.5, 7.5, 0.6, 30)
        p += _blob(rng, 7.5, 7.5, 0.6, 30)
    elif name == "uniform":
        p = [[rng.uniform(0, 10), rng.uniform(0, 10)] for _ in range(120)]
    else:  # blobs3
        p += _blob(rng, 3, 3, 0.7, 40)
        p += _blob(rng, 7, 7, 0.7, 40)
        p += _blob(rng, 3, 7, 0.7, 40)
    rng.shuffle(p)
    return p


def d2(a, b):
    """Squared Euclidean distance."""
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def assign(X, C):
    """Assign each point to nearest centroid."""
    return [min(range(len(C)), key=lambda j: d2(x, C[j])) for x in X]


def inertia(X, C, lab):
    """Sum of squared distances to centroid."""
    return sum(d2(X[i], C[lab[i]]) for i in range(len(X)))


def move(X, C, lab):
    """Move each centroid to mean of its points."""
    out = []
    for j in range(len(C)):
        pts = [X[i] for i in range(len(X)) if lab[i] == j]
        if pts:
            out.append(
                [
                    sum(q[0] for q in pts) / len(pts),
                    sum(q[1] for q in pts) / len(pts),
                ]
            )
        else:
            out.append(C[j])
    return out


def cl(C):
    """Convert centroids to API format."""
    return [{"x": round(c[0], 2), "y": round(c[1], 2)} for c in C]


def run(X, k, seed, max_iter=12):
    """Run Lloyd's algorithm; return steps."""
    rng = random.Random(seed)
    C = [list(X[i]) for i in rng.sample(range(len(X)), k)]

    steps = [
        {
            "type": "init",
            "iteration": 0,
            "centroids": cl(C),
            "assignments": [-1] * len(X),
            "inertia": None,
            "detail": f"Placed {k} random centroids. No point is assigned yet.",
        }
    ]

    prev = [-1] * len(X)
    for it in range(1, max_iter + 1):
        # Assign step
        lab = assign(X, C)
        inr = round(inertia(X, C, lab), 2)
        changed = (
            len(X)
            if it == 1
            else sum(1 for i in range(len(X)) if lab[i] != prev[i])
        )
        det = (
            f"First assignment: every point joins its nearest centroid. Inertia = {inr}."
            if it == 1
            else f"Reassigned points to nearest centroid. {changed} point(s) changed cluster. Inertia = {inr}."
        )
        steps.append(
            {
                "type": "assign",
                "iteration": it,
                "centroids": cl(C),
                "assignments": lab,
                "inertia": inr,
                "changed": changed,
                "detail": det,
            }
        )

        # Move step
        newC = move(X, C, lab)
        shifts = [
            {
                "id": j,
                "from": {"x": round(C[j][0], 2), "y": round(C[j][1], 2)},
                "to": {"x": round(newC[j][0], 2), "y": round(newC[j][1], 2)},
                "dist": round(math.sqrt(d2(C[j], newC[j])), 3),
            }
            for j in range(k)
        ]
        inr2 = round(inertia(X, newC, lab), 2)
        shift_str = ", ".join(f"C{s['id']}→{s['dist']}" for s in shifts)
        steps.append(
            {
                "type": "move",
                "iteration": it,
                "centroids": cl(newC),
                "assignments": lab,
                "inertia": inr2,
                "shifts": shifts,
                "detail": f"Moved each centroid to the mean of its points ({shift_str}). Inertia = {inr2}.",
            }
        )

        moved = sum(s["dist"] for s in shifts)
        C = newC
        prev = lab

        # Stop if converged
        if moved < 1e-4 or (it > 1 and changed == 0):
            break

    return steps


@router.get("")
def get_kmeans(
    dataset: str = Query("blobs3"), k: int = Query(3), seed: int = Query(1)
):
    """Build and return complete K-Means training with animation steps."""
    X = make_dataset(dataset)
    steps = run(X, k, seed)
    return {
        "k": k,
        "total_steps": len(steps),
        "points": [{"x": round(p[0], 2), "y": round(p[1], 2)} for p in X],
        "steps": steps,
        "final_centroids": steps[-1]["centroids"],
    }
