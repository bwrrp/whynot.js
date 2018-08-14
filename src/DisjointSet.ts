import * as assert from "assert";

/**
 * DisjointSet data structure.
 */
export default class DisjointSet {
    private _parent: number[];
    private _rank: number[];

    /**
     * Constructor for a DisjointSet, implementing a Union-Find algorithm with rank values.
     * 
     * @param count amount of elements. 
     */
    constructor(count: number) {
        assert(count > 0);

        this._parent = new Array(count);
        this._rank = new Array(count);

        this.makeSet();
    }

    /**
     * The makeSet operation makes a new set by creating a new element with a unique id, a rank of 0, and a parent pointer to itself. 
     * The parent pointer to itself indicates that the element is the representative member of its own set.
     */
    makeSet() {
        for (var i = 0; i < this._parent.length; i++) {
            this._parent[i] = i;
            this._rank[i] = 0;
        }
    }

    // Getter for parent property.
    get parent(): number[] {
        return this._parent;
    }

    // Getter for rank property.
    get rank(): number[] {
        return this._rank;
    }

    /**
     * find(i) follows the chain of parent pointers from i up the tree until it reaches a root element, whose parent is itself. 
     * This root element is the representative member of the set to which i belongs, and may be i itself.
     * 
     * @param i Element of which to find the root of.
     */
    find(i: number) {
        assert(i >= 0);
        assert(i < this._parent.length);

        // If i is the parent itself, then i is the representative of its set.
        if (this._parent[i] == i) {
            return i;
        }

        // Else traverse to the root to find the represantative of its set.
        var last = i;
        while(this._parent[last] !== last) {
            last = this._parent[last];
        }

        // Cache the result by moving i's node directly under the respresentative of its set.
        // This is called 'path compression'.
        while(this._parent[i] !== i) {
            var t = this._parent[i];
            this._parent[i] = last;
            i = t;
        } 

        return last;
    }

    /**
     * union(i,j) uses find(x) to determine the roots of the trees i and j belong to. 
     * If the roots are distinct, the trees are combined by attaching the root of one to the root of the other. 
     * If this is done naively, such as by always making i a child of j, the height of the trees can grow as O(n). 
     * To prevent this union by rank is used.
     * 
     * @param i The first tree.
     * @param j The second tree.
     */
    union(i: number, j: number) {
        assert(i >= 0);
        assert(i < this._parent.length);
        assert(j >= 0);
        assert(j < this._parent.length);

        // Check if i and j are already in the same set, 
        // in which case we don't have to do anything.
        // This also means that we have found a cycle. 
        var iRep = this.find(i);
        var jRep = this.find(j);
        if (iRep === jRep) {
            return;
        }

        // If i and j are not in the same set, 
        // we can merge the sets and set the new rank accordingly.
        var iRank = this._rank[iRep];
        var jRank = this._rank[jRep];
        if (iRank < jRank) {
            this._rank[iRep] = jRank;
            this._rank[jRep] = iRank
        }

        this._parent[jRep] = iRep;
        if (this._rank[iRep] === this._rank[jRep]) {
            this._rank[iRep]++;
        }
    }
}