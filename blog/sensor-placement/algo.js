export function greedy(func, init, neighb, again){
    let start = init()
    return {
        "best_sol": start,
        "best_val": func(start),
        "val": func(start),
        "sol": start,
        "i": 1,
        "iter": function () {
            if (again(this.i, this.best_val, this.best_sol)) {
                this.sol = neighb(this.best_sol);
                this.val = func(this.sol);
                if (this.val >= this.best_val) {
                    this.best_val = this.val
                    this.best_sol = this.sol
                }
                this.i += 1
            }
            return {"sol": this.best_sol, "val": this.best_val}
        }
    }
}

