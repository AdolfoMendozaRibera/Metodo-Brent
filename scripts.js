// Función principal del método de Brent
function brentMethod(f, xb, options = {}) {
    // Configuración de parámetros
    const xtol = options.xtol || 1e-10;
    const ytol = options.ytol || 1e-8;
    const maxIter = options.maxIter || 100;
    
    // Inicialización de variables
    let [a, b] = xb;
    let fa = f(a);
    let fb = f(b);
    
    // Verificar cambio de signo
    if (fa * fb >= 0) {
        throw new Error("No hay cambio de signo en el intervalo. El método de Brent requiere que f(a) y f(b) tengan signos opuestos.");
    }
    
    // Asegurar que |f(b)| <= |f(a)|
    if (Math.abs(fa) < Math.abs(fb)) {
        [a, b] = [b, a];
        [fa, fb] = [fb, fa];
    }
    
    let c = a;
    let fc = fa;
    let d = c;
    let mflag = true;
    let s = 0;
    let fs = 0;
    let iter = 0;
    let history = [];
    
    while (iter < maxIter) {
        iter++;
        
        // Registrar el estado actual
        history.push({
            iteration: iter,
            a: a,
            b: b,
            c: c,
            f_a: fa,
            f_b: fb,
            f_c: fc
        });
        
        // Condición de parada
        if (Math.abs(b - a) < xtol || fb === 0) {
            return {
                root: b,
                value: fb,
                iterations: iter,
                history: history,
                converged: true
            };
        }
        
        // Selección del método de interpolación
        if (fa !== fc && fb !== fc) {
            // Interpolación cuadrática inversa
            s = (a * fb * fc) / ((fa - fb) * (fa - fc)) +
                (b * fa * fc) / ((fb - fa) * (fb - fc)) +
                (c * fa * fb) / ((fc - fa) * (fc - fb));
        } else {
            // Método de la secante
            s = b - fb * (b - a) / (fb - fa);
        }
        
        // Condiciones para usar bisección
        const condition1 = (s < (3*a + b)/4) || (s > b);
        const condition2 = mflag && (Math.abs(s - b) >= Math.abs(b - c)/2);
        const condition3 = !mflag && (Math.abs(s - b) >= Math.abs(c - d)/2);
        const condition4 = mflag && (Math.abs(b - c) < xtol);
        const condition5 = !mflag && (Math.abs(c - d) < xtol);
        
        if (condition1 || condition2 || condition3 || condition4 || condition5) {
            s = (a + b) / 2;
            mflag = true;
        } else {
            mflag = false;
        }
        
        fs = f(s);
        d = c;
        c = b;
        fc = fb;
        
        if (fa * fs < 0) {
            b = s;
            fb = fs;
        } else {
            a = s;
            fa = fs;
        }
        
        // Asegurar que |f(b)| <= |f(a)|
        if (Math.abs(fa) < Math.abs(fb)) {
            [a, b] = [b, a];
            [fa, fb] = [fb, fa];
        }
    }
    
    return {
        root: b,
        value: fb,
        iterations: iter,
        history: history,
        converged: Math.abs(fb) <= ytol,
        warning: Math.abs(fb) > ytol ? "Puede haber un polo o discontinuidad, o se alcanzó el máximo de iteraciones" : null
    };
}

// Función para parsear la función ingresada por el usuario
function parseFunction(input) {
    try {
        // Reemplazar ^ con ** para exponentes
        const expr = input.replace(/\^/g, '**');
        
        // Crear función segura
        return new Function('x', `
            try {
                return ${expr};
            } catch (e) {
                return NaN;
            }
        `);
    } catch (e) {
        return null;
    }
}

// Función para mostrar resultados
function displayResults(result, func, a, b) {
    const outputDiv = document.getElementById('output');
    
    if (result.error) {
        outputDiv.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${result.error}</p>
            </div>
        `;
        return;
    }
    
    // Generar tabla de iteraciones
    let tableHtml = `
        <h3>Detalle de iteraciones</h3>
        <table>
            <tr>
                <th>Iteración</th>
                <th>a</th>
                <th>b</th>
                <th>f(a)</th>
                <th>f(b)</th>
                <th>Error</th>
            </tr>
    `;
    
    result.history.forEach(iter => {
        const error = Math.abs(iter.b - iter.a);
        tableHtml += `
            <tr>
                <td>${iter.iteration}</td>
                <td>${iter.a.toExponential(6)}</td>
                <td>${iter.b.toExponential(6)}</td>
                <td>${iter.f_a.toExponential(6)}</td>
                <td>${iter.f_b.toExponential(6)}</td>
                <td>${error.toExponential(6)}</td>
            </tr>
        `;
    });
    
    tableHtml += `</table>`;
    
    // Mostrar resultados principales
    outputDiv.innerHTML = `
        <div class="${result.converged ? 'success' : 'warning'}">
            <h3>Resultado</h3>
            <p>Función evaluada: f(x) = ${document.getElementById('function-input').value}</p>
            <p>Intervalo inicial: [${a}, ${b}]</p>
            <p>Raíz encontrada: x ≈ ${result.root.toExponential(8)}</p>
            <p>f(x) ≈ ${result.value.toExponential(8)}</p>
            <p>Iteraciones realizadas: ${result.iterations}</p>
            ${result.warning ? `<p class="warning">Advertencia: ${result.warning}</p>` : ''}
        </div>
        ${tableHtml}
    `;
    
    // Generar gráfico
    generatePlot(func, a, b, result.root);
}

// Función para generar el gráfico
function generatePlot(func, a, b, root) {
    // Generar puntos para el gráfico
    const step = (b - a) / 100;
    const xValues = [];
    const yValues = [];
    
    for (let x = a; x <= b; x += step) {
        xValues.push(x);
        yValues.push(func(x));
    }
    
    // Datos para la función
    const trace1 = {
        x: xValues,
        y: yValues,
        mode: 'lines',
        name: 'f(x)',
        line: {color: 'blue'}
    };
    
    // Datos para la raíz encontrada
    const trace2 = {
        x: [root],
        y: [0],
        mode: 'markers',
        name: 'Raíz',
        marker: {color: 'red', size: 10}
    };
    
    // Datos para el eje x
    const trace3 = {
        x: [a, b],
        y: [0, 0],
        mode: 'lines',
        name: 'Eje x',
        line: {color: 'black', dash: 'dash'}
    };
    
    const layout = {
        title: 'Gráfico de la función y la raíz encontrada',
        xaxis: {title: 'x'},
        yaxis: {title: 'f(x)'},
        showlegend: true
    };
    
    Plotly.newPlot('plot-container', [trace1, trace3, trace2], layout);
}

// Evento al hacer clic en el botón de calcular
document.getElementById('calculate-btn').addEventListener('click', function() {
    try {
        // Obtener valores de entrada
        const funcInput = document.getElementById('function-input').value;
        const a = parseFloat(document.getElementById('lower-bound').value);
        const b = parseFloat(document.getElementById('upper-bound').value);
        const xtol = parseFloat(document.getElementById('xtol').value);
        const ytol = parseFloat(document.getElementById('ytol').value);
        const maxIter = parseInt(document.getElementById('max-iter').value);
        
        // Validar entrada
        if (isNaN(a) || isNaN(b)) {
            throw new Error("Los límites del intervalo deben ser números válidos.");
        }
        
        if (a >= b) {
            throw new Error("El límite inferior debe ser menor que el límite superior.");
        }
        
        // Parsear función
        const f = parseFunction(funcInput);
        if (!f) {
            throw new Error("La función ingresada no es válida.");
        }
        
        // Verificar que la función sea evaluable en los extremos
        if (isNaN(f(a)) || isNaN(f(b))) {
            throw new Error("La función no puede evaluarse en los extremos del intervalo.");
        }
        
        // Ejecutar método de Brent
        const result = brentMethod(f, [a, b], {
            xtol: xtol,
            ytol: ytol,
            maxIter: maxIter
        });
        
        // Mostrar resultados
        displayResults(result, f, a, b);
        
    } catch (error) {
        document.getElementById('output').innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>
        `;
        // Limpiar gráfico en caso de error
        document.getElementById('plot-container').innerHTML = '';
    }
});