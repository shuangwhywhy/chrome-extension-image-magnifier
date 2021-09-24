class MyCanvas {
    constructor({
        width = 6000,
        height = 6000
    }) {
        this.images = [];
        this.cvs = document.querySelector('.canvas');
        this.ctx = this.cvs.getContext('2d');
        this.setBounds({
            width,
            height
        });
        this.transSize = 100;
        this.reset();
        this.paint(this.ctx, 0);
    }

    setBounds({
        width,
        height
    }) {
        this.width = width;
        this.height = height;
        this.cvs.width = width;
        this.cvs.height = height;
    }

    reset() {
        this.images = [];
        this.paintWidth = 4800;
        this.paintHeight = 3600;
        this.paintX = (this.width - this.paintWidth) / 2;
        this.paintY = (this.height - this.paintHeight) / 2;
        this.originRatio = this.paintWidth / this.paintHeight;
    }

    addImage(src) {
        if (src instanceof Image) {
            this.images = [src];
        }
    }

    paint(ctx, ts) {
        ctx.clearRect(0, 0, this.width, this.height);
        // this.paintBg(ctx);
        this.paintImg(ctx);
        requestAnimationFrame(this.paint.bind(this, this.ctx));
    }

    paintBg(ctx) {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.paintX, this.paintY, this.paintWidth, this.paintHeight);
        ctx.fillStyle = '#eee';
        for (let y = this.paintY, r = 0; y <= this.paintHeight + this.paintY - this.transSize; y += this.transSize, r++) {
            for (let x = this.paintX + this.transSize * (r % 2); x <= this.paintWidth + this.paintX - this.transSize; x += this.transSize * 2) {
                ctx.fillRect(x, y, this.transSize, this.transSize);
            }
        }
    }

    paintImg(ctx) {
        this.images.forEach(image => {
            ctx.drawImage(image, 0, 0);
            if (image.zoom) {
                ctx.save();
                ctx.fillStyle = image.zoom.shadow;
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.beginPath();
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(image, 0, 0);
                ctx.closePath();
                ctx.restore();
                ctx.save();
                ctx.beginPath();
                ctx.arc(image.zoom.x, image.zoom.y, image.zoom.r, 0, Math.PI * 2);
                ctx.clip();
                ctx.scale(image.zoom.scale, image.zoom.scale);
                ctx.drawImage(image, image.zoom.dx, image.zoom.dy);
                ctx.restore();
                ctx.save();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = image.zoom.thick;
                ctx.stroke();
                ctx.closePath();
                ctx.restore();
            }
        })
    }
}
const canvas = new MyCanvas({});
const txtImgSrc = document.querySelector('.img-src');
const zoomInput = document.querySelector('.zoom');
const thickInput = document.querySelector('.thick');
const bgInput = document.querySelector('.bg-color');
const shadowInput = document.querySelector('.opacity');
let image = null;

function setImage(blob) {
    const reader = new FileReader();
    reader.addEventListener('load', d => {
        const url = reader.result;
        const img = new Image();
        image = img;
        img.addEventListener('load', m => {
            canvas.setBounds({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
            canvas.addImage(img);
        });
        img.src = url;
    });
    reader.readAsDataURL(blob);
}
let xx = null,
    yy = null;
canvas.cvs.addEventListener('mousedown', e => {
    if (e.which === 1) {
        const {
            offsetX: x,
            offsetY: y
        } = e;
        const {
            width: w,
            height: h
        } = canvas.cvs.getBoundingClientRect();
        const {
            width,
            height
        } = canvas;
        xx = x * width / w;
        yy = y * width / w;
    }
});
canvas.cvs.addEventListener('mousemove', e => {
    if (xx !== null && yy !== null && e.which === 1) {
        const {
            offsetX: x,
            offsetY: y
        } = e;
        const {
            width: w,
            height: h
        } = canvas.cvs.getBoundingClientRect();
        const {
            width,
            height
        } = canvas;
        const x2 = x * width / w;
        const y2 = y * width / w;
        const r = Math.sqrt((x2 - xx) * (x2 - xx) + (y2 - yy) * (y2 - yy));
        const scale = Number(zoomInput.value);
        const m = /^#(\w{2})(\w{2})(\w{2})$/.exec(bgInput.value);
        const R = parseInt(m[1], 16),
            G = parseInt(m[2], 16),
            B = parseInt(m[3], 16);
        const opacity = Number(shadowInput.value);
        image.zoom = {
            x: xx,
            y: yy,
            r,
            scale,
            dx: -xx * (scale - 1) / scale,
            dy: -yy * (scale - 1) / scale,
            shadow: `rgba(${R}, ${G}, ${B}, ${opacity})`,
            thick: Number(thickInput.value)
        };
    }
});
zoomInput.addEventListener('change', e => {
    image.zoom.scale = Number(zoomInput.value);
    image.zoom.dx = -image.zoom.x * (image.zoom.scale - 1) / image.zoom.scale;
    image.zoom.dy = -image.zoom.y * (image.zoom.scale - 1) / image.zoom.scale;
});
thickInput.addEventListener('change', e => {
    image.zoom.thick = Number(thickInput.value);
});
shadowInput.addEventListener('change', e => {
    const m = /^#(\w{2})(\w{2})(\w{2})$/.exec(bgInput.value);
    const r = parseInt(m[1], 16),
        g = parseInt(m[2], 16),
        b = parseInt(m[3], 16);
    const opacity = Number(shadowInput.value);
    image.zoom.shadow = `rgba(${r}, ${g}, ${b}, ${opacity})`;
});
bgInput.addEventListener('change', e => {
    const m = /^#(\w{2})(\w{2})(\w{2})$/.exec(bgInput.value);
    const r = parseInt(m[1], 16),
        g = parseInt(m[2], 16),
        b = parseInt(m[3], 16);
    const opacity = Number(shadowInput.value);
    image.zoom.shadow = `rgba(${r}, ${g}, ${b}, ${opacity})`;
});
canvas.cvs.addEventListener('mouseup', e => {
    xx = null;
    yy = null;
});
// file selection
txtImgSrc.addEventListener('change', e => {
    setImage(txtImgSrc.files[0]);
});
// copy paste
document.addEventListener('paste', e => {
    const items = e.clipboardData.items;
    for (const item of items) {
        if (item.kind === 'file') {
            setImage(item.getAsFile());
        }
    }
});
// drag and drop
document.body.addEventListener('drop', e => {
    console.log(e);
}, false);