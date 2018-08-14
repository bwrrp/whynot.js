import DisjointSet from "../src/DisjointSet";

describe ('DisjointSet', () => {
    describe('MakeSet', () => {
        it('Parent array is initialized', () => {
            let disjointSet = new DisjointSet(7);
            expect(disjointSet.parent.length).toBe(7);
            expect(disjointSet.parent).toEqual([0, 1, 2, 3, 4, 5, 6]);
        });
        
        it('Rank array is initialized', () => {
            let disjointSet = new DisjointSet(7);
            expect(disjointSet.rank.length).toBe(7);
            expect(disjointSet.rank).toEqual([0, 0, 0, 0, 0, 0, 0]);
        });
    });

    describe('Union and Find', () => {
        it('Element is the parent itself', () => {
            let disjointSet = new DisjointSet(7);
            expect(disjointSet.find(2)).toBe(2);
        });

        it('Union of 2 nodes', () => {
            let disjointSet = new DisjointSet(7);
            disjointSet.union(1, 2);
            expect(disjointSet.find(2)).toBe(1);
        });

        it('Finding a cycle', () => {
            let disjointSet = new DisjointSet(7);
            disjointSet.union(1, 2);
            disjointSet.union(1, 2);
            expect(disjointSet.find(2)).toBe(1);
        });

        it('Different ranks', () => {
            let disjointSet = new DisjointSet(7);
            disjointSet.union(1, 2);
            disjointSet.union(0, 1);
            expect(disjointSet.rank[0]).toBe(1);
        })
    });
})