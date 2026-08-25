const API_URL = 'http://localhost:3000/api';

// ==========================================
// FUNCIONES GLOBALES PARA EDITAR, BORRAR Y ESTADÍSTICAS (SQL)
// ==========================================

window.borrarPartido = async function(id) {
    if (confirm("¿Estás seguro de que quieres borrar este partido?")) {
        await fetch(`${API_URL}/partidos/${id}`, { method: 'DELETE' });
        window.location.reload(); 
    }
};

window.editarPartido = function(id) {
    window.location.href = `nuevo-partido.html?edit=${id}`;
};

window.borrarJugador = async function(id) {
    if (confirm("¿Estás seguro de que quieres borrar a este jugador?")) {
        await fetch(`${API_URL}/jugadores/${id}`, { method: 'DELETE' });
        window.location.reload();
    }
};

window.editarJugador = function(id) {
    window.location.href = `nuevo-jugador.html?edit=${id}`;
};

window.sumarAsistencia = async function(id) {
    const res = await fetch(`${API_URL}/jugadores`);
    const jugadores = await res.json();
    const jugador = jugadores.find(j => j.id == id);
    if (jugador) {
        jugador.asistencias = (jugador.asistencias || 0) + 1;
        await fetch(`${API_URL}/jugadores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jugador)
        });
        window.location.reload();
    }
};

window.restarAsistencia = async function(id) {
    const res = await fetch(`${API_URL}/jugadores`);
    const jugadores = await res.json();
    const jugador = jugadores.find(j => j.id == id);
    if (jugador && (jugador.asistencias || 0) > 0) {
        jugador.asistencias -= 1;
        await fetch(`${API_URL}/jugadores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jugador)
        });
        window.location.reload();
    }
};

// ==========================================
// LÓGICA PRINCIPAL AL CARGAR LA PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. LÓGICA DEL FORMULARIO DE JUGADORES ---
    const formJugador = document.getElementById('form-jugador');
    if (formJugador) {
        const urlParams = new URLSearchParams(window.location.search);
        const idEdicion = urlParams.get('edit');

        let jugadorAEditar = null;
        if (idEdicion) {
            const res = await fetch(`${API_URL}/jugadores`);
            const lista = await res.json();
            jugadorAEditar = lista.find(j => j.id == idEdicion);

            if (jugadorAEditar) {
                document.getElementById('nombre').value = jugadorAEditar.nombre;
                document.getElementById('dorsal').value = jugadorAEditar.dorsal;
                document.getElementById('posicion').value = jugadorAEditar.posicion;
                
                document.querySelector('.app-topbar h1').textContent = "Editar Jugador";
                document.querySelector('.btn-formulario').textContent = "Actualizar Jugador";
            }
        }

        formJugador.addEventListener('submit', async function(evento) {
            evento.preventDefault(); 
            const datosJugador = {
                nombre: document.getElementById('nombre').value.trim(),
                dorsal: document.getElementById('dorsal').value,
                posicion: document.getElementById('posicion').value,
                asistencias: jugadorAEditar ? jugadorAEditar.asistencias : 0 
            };

            if (idEdicion) {
                await fetch(`${API_URL}/jugadores/${idEdicion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosJugador)
                });
            } else {
                await fetch(`${API_URL}/jugadores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosJugador)
                });
            }
            window.location.href = 'jugadores.html';
        });
    }

    // --- 2. LÓGICA DEL FORMULARIO DE PARTIDOS ---
    const formPartido = document.getElementById('form-partido');
    if (formPartido) {
        const urlParams = new URLSearchParams(window.location.search);
        const idEdicion = urlParams.get('edit');
        
        const resJugadores = await fetch(`${API_URL}/jugadores`);
        const listaJugadores = await resJugadores.json();
        
        const selectGoleador = document.getElementById('select-goleador');
        if (selectGoleador) {
            listaJugadores.forEach(jugador => {
                let opcion = document.createElement('option');
                opcion.value = jugador.nombre;
                opcion.textContent = jugador.nombre;
                selectGoleador.appendChild(opcion);
            });
        }

        let goleadoresActuales = [];
        const listaGoleadoresUI = document.getElementById('lista-goleadores-form');
        
        function pintarGoleadores() {
            if (!listaGoleadoresUI) return;
            listaGoleadoresUI.innerHTML = '';
            goleadoresActuales.forEach((goleador, idx) => {
                let li = document.createElement('li');
                li.style.marginBottom = '5px';
                li.innerHTML = `⚽ ${goleador} <span style="color:#ff3b30; cursor:pointer; margin-left:10px; font-weight:bold;" onclick="quitarGoleadorForm(${idx})">X</span>`;
                listaGoleadoresUI.appendChild(li);
            });
        }

        window.quitarGoleadorForm = function(idx) {
            goleadoresActuales.splice(idx, 1);
            pintarGoleadores();
        };

        const btnAddGoleador = document.getElementById('btn-add-goleador');
        if (btnAddGoleador) {
            btnAddGoleador.addEventListener('click', () => {
                if(selectGoleador.value) {
                    goleadoresActuales.push(selectGoleador.value);
                    pintarGoleadores();
                    selectGoleador.value = "";
                }
            });
        }

        if (idEdicion) {
            const resPartidos = await fetch(`${API_URL}/partidos`);
            const listaPartidos = await resPartidos.json();
            let p = listaPartidos.find(item => item.id == idEdicion);

            if (p) {
                document.getElementById('fecha').value = p.fecha;
                document.getElementById('rival').value = p.rival;
                document.getElementById('goles-local').value = p.golesLocal || '';
                document.getElementById('goles-visitante').value = p.golesVisitante || '';
                
                if (p.goleadores) {
                    goleadoresActuales = p.goleadores;
                    pintarGoleadores();
                }
                
                document.querySelector('.app-topbar h1').textContent = "Editar Partido";
                document.querySelector('.btn-formulario').textContent = "Actualizar Partido";
            }
        }

        formPartido.addEventListener('submit', async function(evento) {
            evento.preventDefault(); 
            const datosPartido = {
                fecha: document.getElementById('fecha').value,
                rival: document.getElementById('rival').value,
                golesLocal: document.getElementById('goles-local').value,
                golesVisitante: document.getElementById('goles-visitante').value,
                goleadores: goleadoresActuales
            };

            if (idEdicion) {
                await fetch(`${API_URL}/partidos/${idEdicion}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosPartido)
                });
            } else {
                await fetch(`${API_URL}/partidos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosPartido)
                });
            }
            window.location.href = 'partidos.html';
        });
    }

    // --- 3. MOSTRAR LISTA DE JUGADORES ---
    const contenedorJugadores = document.getElementById('contenedor-jugadores');
    if (contenedorJugadores) {
        const res = await fetch(`${API_URL}/jugadores`);
        const listaJugadores = await res.json();
        contenedorJugadores.innerHTML = '';

        if (listaJugadores.length === 0) {
            contenedorJugadores.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e93;">Aún no hay jugadores. ¡Pulsa + Nuevo para añadir el primero!</div>';
        } else {
            listaJugadores.forEach(jugador => {
                let emoji = '👤';
                if (jugador.posicion === 'Portero') emoji = '🧤';
                else if (jugador.posicion === 'Defensa') emoji = '🛡️';
                else if (jugador.posicion === 'Medio') emoji = '👟';
                else if (jugador.posicion === 'Delantero') emoji = '⚽';

                const divJugador = document.createElement('div');
                divJugador.className = 'jugador-item';
                divJugador.style.display = 'block'; 
                divJugador.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            <div class="avatar">${emoji}</div>
                            <div class="info-jugador" style="margin-left: 10px;">
                                <span class="nombre-jugador">${jugador.nombre}</span>
                                <span class="posicion-jugador">${jugador.posicion}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="background-color: #f2f2f7; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1c1c1e;">
                                ${jugador.dorsal}
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="editarJugador(${jugador.id})" style="background: none; border: none; font-size: 18px; cursor: pointer;" title="Editar">✏️</button>
                                <button onclick="borrarJugador(${jugador.id})" style="background: none; border: none; font-size: 18px; cursor: pointer;" title="Borrar">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
                contenedorJugadores.appendChild(divJugador);
            });
        }
    }

    // --- 4. MOSTRAR LISTA DE PARTIDOS ---
    const contenedorPartidos = document.getElementById('contenedor-partidos');
    if (contenedorPartidos) {
        const res = await fetch(`${API_URL}/partidos`);
        const listaPartidos = await res.json();
        contenedorPartidos.innerHTML = '';

        if (listaPartidos.length === 0) {
            contenedorPartidos.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e93;">Aún no hay partidos. ¡Añade el primero!</div>';
        } else {
            listaPartidos.forEach(partido => {
                let fechaBonita = partido.fecha ? partido.fecha.replace('T', ' - ') : '';
                
                let textoMarcador = "VS";
                if (partido.golesLocal !== "" && partido.golesVisitante !== "" && partido.golesLocal !== undefined && partido.golesLocal !== null) {
                    textoMarcador = `${partido.golesLocal} - ${partido.golesVisitante}`;
                }

                let htmlGoleadores = "";
                if (partido.goleadores && partido.goleadores.length > 0) {
                    htmlGoleadores = `<div style="font-size: 13px; color: #007aff; margin-top: 12px; text-align: center; background: #f0f8ff; padding: 5px; border-radius: 5px;">⚽ Goles: ${partido.goleadores.join(', ')}</div>`;
                }

                const divPartido = document.createElement('div');
                divPartido.className = 'tarjeta-partido';
                divPartido.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f2f2f7; padding-bottom: 8px;">
                        <div class="fecha-partido" style="margin-bottom: 0;">${fechaBonita}</div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="editarPartido(${partido.id})" style="background: none; border: none; font-size: 16px; cursor: pointer;" title="Editar Resultado">✏️</button>
                            <button onclick="borrarPartido(${partido.id})" style="background: none; border: none; font-size: 16px; cursor: pointer;" title="Borrar">🗑️</button>
                        </div>
                    </div>
                    <div class="marcador">
                        <span class="equipo" style="flex:1; text-align:right; padding-right:10px;">Mi Equipo</span>
                        <span class="resultado">${textoMarcador}</span>
                        <span class="equipo" style="flex:1; text-align:left; padding-left:10px;">${partido.rival}</span>
                    </div>
                    ${htmlGoleadores}
                `;
                contenedorPartidos.appendChild(divPartido);
            });
        }
    }

    // --- 5. MOSTRAR ESTADÍSTICAS ---
    const contenedorEstadisticas = document.getElementById('contenedor-estadisticas');
    if (contenedorEstadisticas) {
        const resJ = await fetch(`${API_URL}/jugadores`);
        const listaJugadores = await resJ.json();
        
        const resP = await fetch(`${API_URL}/partidos`);
        const listaPartidos = await resP.json();
        
        let conteoGoles = {};
        listaPartidos.forEach(partido => {
            if (partido.goleadores) {
                partido.goleadores.forEach(goleador => {
                    conteoGoles[goleador] = (conteoGoles[goleador] || 0) + 1;
                });
            }
        });

        contenedorEstadisticas.innerHTML = '';

        if (listaJugadores.length === 0) {
            contenedorEstadisticas.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e93;">Aún no hay jugadores en la plantilla.</div>';
        } else {
            listaJugadores.forEach(jugador => {
                let golesAutom = conteoGoles[jugador.nombre] || 0;
                let asistencias = jugador.asistencias || 0;

                const divStat = document.createElement('div');
                divStat.className = 'jugador-item';
                divStat.style.display = 'block';
                divStat.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="font-weight: bold; font-size: 16px;">${jugador.nombre}</div>
                        <div style="display: flex; gap: 20px; text-align: center;">
                            <div>
                                <div style="font-size: 18px; font-weight: bold;">⚽ ${golesAutom}</div>
                                <div style="font-size: 10px; color: #8e8e93;">Goles</div>
                            </div>
                            <div>
                                <div style="font-size: 18px; font-weight: bold;">👟 ${asistencias}</div>
                                <div style="font-size: 10px; color: #8e8e93;">Asists</div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; display: flex; justify-content: space-between; border-top: 1px solid #e5e5ea; padding-top: 10px; align-items: center;">
                        <span style="font-size: 12px; color: #8e8e93;">Gestión manual:</span>
                        <div>
                            <button onclick="restarAsistencia(${jugador.id})" class="btn-pequeno" style="padding: 4px 10px; background-color: #ff3b30;">- 1 Asist</button>
                            <button onclick="sumarAsistencia(${jugador.id})" class="btn-pequeno" style="padding: 4px 10px; margin-left: 5px;">+ 1 Asist</button>
                        </div>
                    </div>
                `;
                contenedorEstadisticas.appendChild(divStat);
            });
        }
    }

    // --- 6. WIDGET INDEX: PRÓXIMO PARTIDO ---
    const widgetProximoPartido = document.getElementById('widget-proximo-partido');
    if (widgetProximoPartido) {
        const res = await fetch(`${API_URL}/partidos`);
        const listaPartidos = await res.json();
        
        if (listaPartidos.length === 0) {
            widgetProximoPartido.innerHTML = '<p style="color: #8e8e93; text-align: center; margin-top: 10px;">Aún no hay partidos programados.</p>';
        } else {
            let proximo = listaPartidos.find(p => !p.golesLocal && !p.golesVisitante);
            if (!proximo) proximo = listaPartidos[listaPartidos.length - 1];

            let fechaBonita = proximo.fecha ? proximo.fecha.replace('T', ' - ') : '';
            
            widgetProximoPartido.innerHTML = `
                <div class="tarjeta-partido" style="margin-top: 10px; border: 1px solid #e5e5ea; box-shadow: none;">
                    <div class="fecha-partido">${fechaBonita}</div>
                    <div class="marcador">
                        <span class="equipo" style="flex:1; text-align:right; padding-right:10px;">Mi Equipo</span>
                        <span class="resultado">VS</span>
                        <span class="equipo" style="flex:1; text-align:left; padding-left:10px;">${proximo.rival}</span>
                    </div>
                </div>
            `;
        }
    }

    // --- 7. TABLA DE CLASIFICACIÓN ---
    const cuerpoTablaStats = document.getElementById('cuerpo-tabla-stats');
    if (cuerpoTablaStats) {
        const resJ = await fetch(`${API_URL}/jugadores`);
        const listaJugadores = await resJ.json();
        
        const resP = await fetch(`${API_URL}/partidos`);
        const listaPartidos = await resP.json();
        
        let conteoGoles = {};
        listaPartidos.forEach(partido => {
            if (partido.goleadores) {
                partido.goleadores.forEach(goleador => {
                    conteoGoles[goleador] = (conteoGoles[goleador] || 0) + 1;
                });
            }
        });

        cuerpoTablaStats.innerHTML = '';

        if (listaJugadores.length === 0) {
            cuerpoTablaStats.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #8e8e93; padding: 20px;">No hay jugadores</td></tr>';
        } else {
            listaJugadores.sort((a, b) => {
                let golesA = conteoGoles[a.nombre] || 0;
                let golesB = conteoGoles[b.nombre] || 0;
                return golesB - golesA; 
            });

            listaJugadores.forEach(jugador => {
                let golesAutom = conteoGoles[jugador.nombre] || 0;
                let asistencias = jugador.asistencias || 0;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: bold;">${jugador.nombre}</td>
                    <td style="text-align: center; font-weight: bold; color: #007aff;">${golesAutom}</td>
                    <td style="text-align: center; color: #8e8e93;">${asistencias}</td>
                `;
                cuerpoTablaStats.appendChild(tr);
            });
        }
    }

});