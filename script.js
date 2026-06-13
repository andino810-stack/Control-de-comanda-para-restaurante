let contadorComandas = 0;
let wakeLock = null;
let comandosActivos = 0;
let intervaloTicTac = null;

// ============================
// PERMISO DE CÁMARA
// ============================
async function pedirPermisoCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        document.getElementById("camara").srcObject = stream;
        console.log("Permiso otorgado ✔️");
    } catch (err) {
        console.error("No se pudo acceder a la cámara ❌", err);
        alert("Debes permitir la cámara para usar los gestos.");
    }
}

pedirPermisoCamara();

// ============================
// PREVENIR QUE LA PANTALLA SE APAGUE
// ============================
async function activarPantalla() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("Pantalla activa");
        }
    } catch (err) {
        console.error("Error activando pantalla:", err);
    }
}

document.addEventListener("DOMContentLoaded", activarPantalla);

// ============================
// SONIDO TIC-TAC
// ============================
function iniciarTicTac() {
    const toc = document.getElementById("toc");

    if (intervaloTicTac) return;

    intervaloTicTac = setInterval(() => {
        toc.currentTime = 0;
        toc.play().catch(() => {});
    }, 1000);
}

function detenerTicTac() {
    if (intervaloTicTac) {
        clearInterval(intervaloTicTac);
        intervaloTicTac = null;
    }
}

// ============================
// CREAR COMANDA
// ============================
function agregarComanda() {
    contadorComandas++;

    const comandaDiv = document.createElement("div");
    comandaDiv.className = "comanda";
    comandaDiv.id = "comanda_" + contadorComandas;

    const titulo = document.createElement("h2");
    titulo.innerText = "Comanda N°" + contadorComandas;
    comandaDiv.appendChild(titulo);

    const botonEntrada = document.createElement("button");
    botonEntrada.innerText = "▶️ Servir Entrada";
    botonEntrada.onclick = () => iniciarTemporizador(comandaDiv, botonEntrada);
    comandaDiv.appendChild(botonEntrada);

    const timer = document.createElement("h1");
    timer.innerText = "20:00";
    timer.style.display = "none";
    comandaDiv.appendChild(timer);

    const botonDetener = document.createElement("button");
    botonDetener.innerText = "⏹️ Detener Comanda";
    botonDetener.style.display = "none";
    botonDetener.onclick = () => detenerTemporizador(comandaDiv);
    comandaDiv.appendChild(botonDetener);

    document.getElementById("comandas").appendChild(comandaDiv);
}

// ============================
// TEMPORIZADOR
// ============================
function iniciarTemporizador(comandaDiv, botonEntrada) {
    let tiempoRestante = 20 * 60;
    const timer = comandaDiv.querySelector("h1");
    const botonDetener = comandaDiv.querySelector("button:last-child");
    const alarma = document.getElementById("alarma");

    timer.style.display = "block";
    botonDetener.style.display = "inline-block";
    botonEntrada.remove();

    comandosActivos++;
    if (comandosActivos === 1) iniciarTicTac();

    let alarmaReproducida = false;
    let tiempoNegativo = 0;

    const interval = setInterval(() => {
        if (comandaDiv.dataset.detener === "true") {
            clearInterval(interval);
            comandosActivos--;
            if (comandosActivos === 0) detenerTicTac();
            return;
        }

        tiempoRestante--;

        let minutos, segundos;

        if (tiempoRestante >= 0) {
            minutos = Math.floor(tiempoRestante / 60);
            segundos = tiempoRestante % 60;
            timer.innerText = `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
        } else {
            tiempoNegativo++;
            minutos = Math.floor(tiempoNegativo / 60);
            segundos = tiempoNegativo % 60;
            timer.innerText = `-${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
            timer.style.color = "#ffcccc";
        }

        if (tiempoRestante === 5 * 60) {
            comandaDiv.classList.add("tiempo-amarillo");
        }

        if (tiempoRestante === 0) {
            comandaDiv.classList.remove("tiempo-amarillo");
            comandaDiv.classList.add("tiempo-terminado");
            if (!alarmaReproducida) {
                alarma.volume = 1.0;
                alarma.play().catch(err => console.log("Error de audio:", err));
                alarmaReproducida = true;
            }
        }
    }, 1000);

    comandaDiv.dataset.intervalId = interval;
}

function detenerTemporizador(comandaDiv) {
    comandaDiv.dataset.detener = "true";
    const timer = comandaDiv.querySelector("h1");
    timer.style.color = "gray";
}

// ============================
// MEDIA PIPE – MANO
// ============================
const video = document.getElementById("camara");

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.4,
    minTrackingConfidence: 0.4
});

// Iniciar cámara con MediaPipe
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 320,
    height: 240
});
camera.start();

let ultimaComanda = null 


let manoDetectada = false;
hands.onResults(results => {
    console.log(results.multiHandLandmarks);

    if (results.multiHandLandmarks &&
        results.multiHandLandmarks.length > 0) {

        console.log("MANO DETECTADA");

        agregarComanda();
    }

});
