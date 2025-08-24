export function generateSTL(result) {
    const { positions, cells } = result;
    const buffer = new ArrayBuffer(80 + 4 + cells.length * 50);
    const view = new DataView(buffer);
    let pos = 80;

    view.setUint32(pos, cells.length, true);
    pos += 4;

    for (const cell of cells) {
        const p1 = positions[cell[0]];
        const p2 = positions[cell[1]];
        const p3 = positions[cell[2]];

        const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

        const normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
        ];

        const l = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
        normal[0] /= l;
        normal[1] /= l;
        normal[2] /= l;

        view.setFloat32(pos, normal[0], true); pos += 4;
        view.setFloat32(pos, normal[1], true); pos += 4;
        view.setFloat32(pos, normal[2], true); pos += 4;

        view.setFloat32(pos, p1[0], true); pos += 4;
        view.setFloat32(pos, p1[1], true); pos += 4;
        view.setFloat32(pos, p1[2], true); pos += 4;

        view.setFloat32(pos, p2[0], true); pos += 4;
        view.setFloat32(pos, p2[1], true); pos += 4;
        view.setFloat32(pos, p2[2], true); pos += 4;

        view.setFloat32(pos, p3[0], true); pos += 4;
        view.setFloat32(pos, p3[1], true); pos += 4;
        view.setFloat32(pos, p3[2], true); pos += 4;

        pos += 2;
    }

    const blob = new Blob([view], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'model.stl';
    link.click();
}
