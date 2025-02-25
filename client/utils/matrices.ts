/*
Matrix related boilerplate functions
These functions are specifically for 3x3 matrices
These functions use radians
*/
import * as float from './float';

export function multiply2Matrices(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }

    return result;
}

export function multiplyMatricesList(matrices: number[][][]): number[][] {
    return matrices.reduce((acc, matrix) => multiply2Matrices(acc, matrix));
}

export function multiplyMatrixByVector(matrix: number[][], vector: number[]): number[] {
    const result: number[] = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            result[i] += matrix[i][j] * vector[j];
        }
    }

    return result;
}

export function transposeMatrix(matrix: number[][]): number[][] {
    const result: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            result[i][j] = matrix[j][i];
        }
    }

    return result;
}

export function rotationMatrix(creaseDirection: number, foldAngle: number): number[][]{
    /*
    Express a crease as a rotation matrix around a vertex. Takes a fold angle and crease direction. 

    Suppose we are working with vertex v1 and want to express crease c. Take the location of C's other vertex v2. Then, creaseDirection = math.atan2(v2.y - v1.y, v2.x - v1.x). 
    
    Fold angle ranges from -pi (M) to pi (V).

    This matrix is derived from Rodrigues' rotation formula.
    */
    const crho = Math.cos(foldAngle);
    const srho = Math.sin(foldAngle);
    const ctheta = Math.cos(creaseDirection);
    const stheta = Math.sin(creaseDirection);
    const result: number[][] = [
        [1-(1-crho)*(stheta)**2, (1-crho)*ctheta*stheta, srho*stheta],
        [(1-crho)*ctheta*stheta, 1-(1-crho)*(ctheta)**2, -srho*ctheta],
        [-srho*stheta, srho*ctheta, crho]
    ];
    return result
}

export function rotationMatrixToVector(matrix: number[][]): number[] {
    return [matrix[2][1]-matrix[1][2], matrix[0][2]-matrix[2][0], matrix[1][0]-matrix[0][1]];
}

export function isIdentity(matrix:number[][]):boolean{
    return matrix.every((row, rowIndex) => row.every((value, colIndex) => (rowIndex === colIndex) ? float.eq(value,1) : float.eq(value,0)));
}