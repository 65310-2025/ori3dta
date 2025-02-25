/*
Math helper functions for dealing with floating point errors
*/

export function eq(a:number,b:number){
    return Math.abs(a-b) < 1e-10;
}