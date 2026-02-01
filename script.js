// ===== DATOS =====
let citas = JSON.parse(localStorage.getItem("citas")) || [];
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let estadosDias = JSON.parse(localStorage.getItem("estadosDias")) || {};

// ===== VARIABLES GLOBALES =====
let year = new Date().getFullYear();
let diaSeleccionado = null; // día marcado para habilitar/deshabilitar/festivo
let diaModal = null;         // día abierto en modal
let horaSeleccionada = null; // hora seleccionada para nueva cita

// ===== ELEMENTOS =====
const calendar = document.getElementById("calendar");
const yearLabel = document.getElementById("yearLabel");
const dayView = document.getElementById("dayView");
const dayTitle = document.getElementById("dayTitle");
const horasContainer = document.getElementById("horasContainer");

const selectCliente = document.getElementById("selectCliente");
const telefonoCita = document.getElementById("telefonoCita");
const servicioCita = document.getElementById("servicioCita");
const servicioPersonalizado = document.getElementById("servicioPersonalizado");
const guardarCita = document.getElementById("guardarCita");

const btnHabilitar = document.getElementById("btnHabilitar");
const btnDeshabilitar = document.getElementById("btnDeshabilitar");
const btnFestivo = document.getElementById("btnFestivo");

// ===== NAV AÑOS =====
document.getElementById("prevYear").onclick = () => { year--; renderCalendar(); }
document.getElementById("nextYear").onclick = () => { year++; renderCalendar(); }
document.getElementById("closeDayView").onclick = () => dayView.style.display = "none";

// ===== FORMATO FECHA =====
function formatDate(d){
  let y = d.getFullYear();
  let m = String(d.getMonth()+1).padStart(2,'0');
  let day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function formatDateVisual(d){
  const opciones = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
  return d.toLocaleDateString('es-ES', opciones)
           .replace(/^\w/, c => c.toUpperCase()); // Pone la primera letra en mayúscula
}


// ===== ESTADO DEL DÍA =====
function getEstado(date){
  const str = formatDate(date);
  if(estadosDias[str]) return estadosDias[str];
  const day = date.getDay();
  if(day === 0 || day === 1) return "cerrado"; // domingo/lunes
  return "habilitado";
}

// ===== HORAS DEL DÍA =====
function generarHoras(date){
  if(getEstado(date)!=="habilitado") return [];
  const day = date.getDay();
  let a=9, c=20; 
  if(day === 6){ a=8; c=15; } // sábado
  let horas = [];
  for(let h=a; h<c; h++){
    horas.push(`${String(h).padStart(2,'0')}:00`);
    horas.push(`${String(h).padStart(2,'0')}:30`);
  }
  return horas;
}

// ===== COLOR DE OCUPACIÓN =====
function ocupacionColor(date){
  const horas = generarHoras(date).length;
  if(horas===0) return "#bdbdbd";
  const ocupadas = citas.filter(c=>c.fecha===formatDate(date)).length;
  const p = ocupadas/horas;
  if(p===0) return "#90ee90";      // verde
  if(p<0.4) return "#ffeb3b";      // amarillo
  if(p<0.7) return "#ff9800";      // naranja
  return "#800020";                 // granate alta ocupación
}

// ===== RENDER CALENDARIO =====
function renderCalendar(){
  yearLabel.textContent = year;
  calendar.innerHTML = "";

  for(let m=0; m<12; m++){
    const monthDiv = document.createElement("div");
    monthDiv.className = "month";
    monthDiv.innerHTML = `<h4>${new Date(year,m).toLocaleString('es',{month:'long'})}</h4>`;

    const grid = document.createElement("div");
    grid.className = "month-days";

    ["L","M","X","J","V","S","D"].forEach(d=>{
      let name = document.createElement("div");
      name.className = "day-name";
      name.textContent = d;
      grid.appendChild(name);
    });

    let firstDay = new Date(year,m,1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay-1;
    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement("div"));

    const days = new Date(year,m+1,0).getDate();
    for(let d=1; d<=days; d++){
      const date = new Date(year,m,d);
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      dayDiv.textContent = d;

      const estado = getEstado(date);
      if(estado==="cerrado") dayDiv.style.background="#bdbdbd";
      else if(estado==="festivo"){ dayDiv.style.background="#800020"; dayDiv.style.color="white"; }
      else dayDiv.style.background = ocupacionColor(date);

      renderTotalCitas();

      // ===== SELECCIÓN DEL DÍA =====
      let touchTimer;

      // TOQUE / CLICK
      dayDiv.addEventListener("mousedown", (e)=>{
        e.preventDefault();
        diaSeleccionado = date;
        highlightDay(dayDiv);
      });

      dayDiv.addEventListener("touchstart", (e)=>{
        e.preventDefault();
        diaSeleccionado = date;
        highlightDay(dayDiv);
        touchTimer = setTimeout(()=>{ openDay(date); }, 500); // toque largo
      });

      dayDiv.addEventListener("touchend", (e)=>{
        clearTimeout(touchTimer);
      });

      // DOBLE CLIC EN ESCRITORIO
      dayDiv.ondblclick = ()=>{
        if(getEstado(date)==="habilitado") openDay(date);
      }

      // CLIC NORMAL EN ESCRITORIO NO ABRE MODAL
      dayDiv.onclick = (e)=>{
        if(e.detail === 1){ // solo marca día
          diaSeleccionado = date;
          highlightDay(dayDiv);
        }
      }

      grid.appendChild(dayDiv);
    }

    monthDiv.appendChild(grid);
    calendar.appendChild(monthDiv);
  }
}

// ===== RESALTAR DÍA =====
function highlightDay(el){
  document.querySelectorAll(".day").forEach(d=>d.classList.remove("selected-day"));
  el.classList.add("selected-day");
}

// ===== MODAL DÍA =====
function openDay(date){
  diaModal = date;
  dayView.style.display = "block";
  dayTitle.textContent = formatDateVisual(date);

  renderHoras();
}

// ===== RENDER HORAS DEL DÍA =====
function renderHoras(){
  horasContainer.innerHTML = "";
  generarHoras(diaModal).forEach(h=>{
    const row = document.createElement("div");
    row.className = "hour-row";
    const cita = citas.find(c=>c.fecha===formatDate(diaModal)&&c.hora===h);

    if(cita){
      row.innerHTML = `
      <span>${h}</span>
      <span class="info-cita">
      <strong>${getCliente(cita.clienteId)}</strong>
      <strong class="tel"> (${getTelefono(cita.clienteId)})</strong>
      <span class="servicio"> - ${cita.servicio}</span>
      </span>
      <button onclick="borrar(${cita.id})">🗑</button>
`;

    } else {
      row.classList.add("free");
      row.innerHTML = `<span>${h}</span><button onclick="nueva('${h}')">➕</button>`;
    }
    horasContainer.appendChild(row);
  });
}

// ===== NUEVA CITA =====
function cargarClientes(){
  selectCliente.innerHTML = "<option value=''>Seleccionar</option>";
  clientes.forEach(c=>{
    const o = document.createElement("option");
    o.value = c.id; o.textContent = c.nombre;
    selectCliente.appendChild(o);
  });
}
const buscadorCliente = document.getElementById("buscadorCliente");

buscadorCliente.addEventListener("input", () => {
  const texto = buscadorCliente.value.toLowerCase();

  selectCliente.innerHTML = "<option value=''>Seleccionar</option>";

  clientes
    .filter(c => c.nombre.toLowerCase().includes(texto))
    .forEach(c => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.nombre;
      selectCliente.appendChild(o);
    });
});


function nueva(h){
  horaSeleccionada = h;
  document.getElementById("formCita").style.display = "block";
  cargarClientes();
  servicioPersonalizado.style.display = "none";
}

selectCliente.onchange = ()=>{
  const c = clientes.find(x=>x.id==selectCliente.value);
  telefonoCita.value = c ? c.telefono : "";
}

servicioCita.onchange = ()=>{
  if(servicioCita.value==="otros"){
    servicioPersonalizado.style.display = "block";
  } else {
    servicioPersonalizado.style.display = "none";
  }
}

guardarCita.onclick = ()=>{
  const clienteId = selectCliente.value;
  if(!clienteId) return alert("Selecciona cliente");
  let servicio = servicioCita.value==="otros" ? servicioPersonalizado.value : servicioCita.value;
  if(!servicio) return alert("Escribe el servicio");
  citas.push({id:Date.now(), fecha:formatDate(diaModal), hora:horaSeleccionada, clienteId:+clienteId, servicio});
  localStorage.setItem("citas", JSON.stringify(citas));
  cerrarForm(); renderHoras(); renderCalendar();
}

// CERRAR FORMULARIO
function cerrarForm(){
  document.getElementById("formCita").style.display="none";
}

// BORRAR CITA
function borrar(id){
  citas = citas.filter(c=>c.id!==id);
  localStorage.setItem("citas", JSON.stringify(citas));
  renderHoras(); renderCalendar();
}

// NOMBRE CLIENTE
function getCliente(id){
  const c = clientes.find(c=>c.id===id);
  return c ? c.nombre : "";
}
function getTelefono(id){
  const c = clientes.find(c=>c.id===id);
  return c ? c.telefono : "";
}


// ===== BOTONES DE ESTADO =====
btnHabilitar.onclick = ()=>{ setEstado("habilitado"); }
btnDeshabilitar.onclick = ()=>{ setEstado("cerrado"); }
btnFestivo.onclick = ()=>{ setEstado("festivo"); }

function setEstado(estado){
  if(!diaSeleccionado) return alert("Pon el cursor o toca un día primero");
  estadosDias[formatDate(diaSeleccionado)] = estado;
  localStorage.setItem("estadosDias", JSON.stringify(estadosDias));
  renderCalendar();
}

// ===== INICIO =====
renderCalendar();

// ===== MODAL ARRASTRABLE (SOLO CABECERA) =====
const modalContent = document.querySelector("#dayView .modal-content");
const modalHeader  = document.querySelector("#dayView .modal-header");

let isDragging = false;
let startX = 0, startY = 0;
let origX = 0, origY = 0;

// MOUSE
modalHeader.addEventListener("mousedown", (e)=>{
  if(e.target.classList.contains("close")) return;

  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;

  const rect = modalContent.getBoundingClientRect();
  origX = rect.left;
  origY = rect.top;

  modalContent.style.position = "fixed";
  modalContent.style.transition = "none";
});

document.addEventListener("mousemove", (e)=>{
  if(!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  modalContent.style.left = origX + dx + "px";
  modalContent.style.top  = origY + dy + "px";
});

document.addEventListener("mouseup", ()=>{
  isDragging = false;
  modalContent.style.transition = "";
});

// TOUCH
modalHeader.addEventListener("touchstart", (e)=>{
  if(e.target.classList.contains("close")) return;

  const touch = e.touches[0];
  isDragging = true;
  startX = touch.clientX;
  startY = touch.clientY;

  const rect = modalContent.getBoundingClientRect();
  origX = rect.left;
  origY = rect.top;

  modalContent.style.position = "fixed";
  modalContent.style.transition = "none";
});

document.addEventListener("touchmove", (e)=>{
  if(!isDragging) return;

  const touch = e.touches[0];
  const dx = touch.clientX - startX;
  const dy = touch.clientY - startY;

  modalContent.style.left = origX + dx + "px";
  modalContent.style.top  = origY + dy + "px";
});

document.addEventListener("touchend", ()=>{
  isDragging = false;
  modalContent.style.transition = "";
});
document.getElementById("exportarPDF").onclick = exportarPDF;

function exportarPDF(){
  if(!diaModal) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Fecha con día de la semana
  const fechaVisual = formatDateVisual(diaModal); // Ej: "Martes 27/01/2026"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(fechaVisual, 20, 20);

  let y = 35;
  const horas = generarHoras(diaModal);

  horas.forEach(h=>{
    const cita = citas.find(c=>c.fecha===formatDate(diaModal) && c.hora===h);
    if(cita){
      const nombre = getCliente(cita.clienteId);
      const tel = getTelefono(cita.clienteId);
      const servicio = cita.servicio;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${h} - ${nombre}`, 20, y);

      if(tel){
        doc.setFont("helvetica", "bold");
        doc.text(`(${tel})`, 70, y); // ajusta x=70 para ponerlo a la derecha del nombre
      }

      doc.setFont("helvetica", "normal");
      doc.text(`- ${servicio}`, 100, y); // ajusta según el ancho que necesites

      y += 8;
      if(y > 280){ // salto de página
        doc.addPage();
        y = 20;
      }
    }
  });

  doc.save(`Citas_${formatDate(diaModal)}.pdf`);
}
function renderTotalCitas() {
  // Contamos solo las citas del año actual
  const total = citas.filter(c => new Date(c.fecha).getFullYear() === year).length;
  document.getElementById("totalCitas").textContent = `Total Citas Año: ${total}`;
}
// ===============================
// EXPORTAR DATOS A JSON
// ===============================
document.getElementById("exportarDatos").addEventListener("click", () => {

  const copia = {};

  // Guardamos TODO el localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i);
    copia[clave] = localStorage.getItem(clave);
  }

  const blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "backup_agenda.json";
  a.click();

  URL.revokeObjectURL(url);
});
// ===============================
// IMPORTAR DATOS DESDE JSON
// ===============================
const inputArchivo = document.getElementById("importarArchivo");

document.getElementById("importarDatosBtn").addEventListener("click", () => {
  inputArchivo.click();
});

inputArchivo.addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();

  lector.onload = (event) => {
    try {
      const datos = JSON.parse(event.target.result);

      if (confirm("Esto reemplazará todos los datos actuales. ¿Continuar?")) {

        // Limpiamos antes
        localStorage.clear();

        // Restauramos todo
        for (let clave in datos) {
          localStorage.setItem(clave, datos[clave]);
        }

        alert("Datos importados correctamente ✅");
        location.reload(); // recarga para actualizar la app
      }

    } catch (error) {
      alert("Archivo no válido ❌");
    }
  };

  lector.readAsText(archivo);
});
