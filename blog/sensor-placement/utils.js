export function rand(min, max) {
    return Math.random() * (max - min) + min;
}

export function randint(max) {
    return Math.floor(Math.random() * max);
}

export function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x,2)+Math.pow(p2.y - p1.y,2))
}

