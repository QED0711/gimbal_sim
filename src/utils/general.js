export const betweenRange = (n, min, max) => {
    if(n < min) return min;
    if(n > max) return max;
    return n;
}