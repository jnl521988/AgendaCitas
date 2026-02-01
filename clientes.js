let clientes = JSON.parse(localStorage.getItem("agenda_clientes")) || [];
let editId=null;

const tablaClientes=document.getElementById("tablaClientes");
const nuevoCliente=document.getElementById("nuevoCliente");
const modalCliente=document.getElementById("modalCliente");
const closeCliente=document.getElementById("closeCliente");
const formCliente=document.getElementById("formCliente");
const nombre=document.getElementById("nombre");
const telefono=document.getElementById("telefono");
const detalle=document.getElementById("detalle");

function render(){
 tablaClientes.innerHTML="";
 clientes.forEach(c=>{
  tablaClientes.innerHTML+=`<tr>
  <td>${c.nombre}</td><td>${c.telefono}</td><td>${c.detalle}</td>
  <td><button onclick="edit(${c.id})">✏️</button>
  <button onclick="del(${c.id})">🗑</button></td></tr>`;
 });
}
render();
const buscadorClientesTabla = document.getElementById("buscadorClientesTabla");

buscadorClientesTabla.addEventListener("input", () => {
  const texto = buscadorClientesTabla.value.toLowerCase();

  tablaClientes.innerHTML = "";

  clientes
    .filter(c =>
      c.nombre.toLowerCase().includes(texto) ||
      c.telefono.includes(texto) ||
      c.detalle.toLowerCase().includes(texto)
    )
    .forEach(c => {
      tablaClientes.innerHTML += `
        <tr>
          <td>${c.nombre}</td>
          <td>${c.telefono}</td>
          <td>${c.detalle}</td>
          <td>
            <button onclick="edit(${c.id})">✏️</button>
            <button onclick="del(${c.id})">🗑</button>
          </td>
        </tr>`;
    });
});


nuevoCliente.onclick=()=>modalCliente.style.display="block";
closeCliente.onclick=()=>modalCliente.style.display="none";

formCliente.onsubmit=e=>{
 e.preventDefault();
 if(editId){
  let c=clientes.find(c=>c.id===editId);
  c.nombre=nombre.value;c.telefono=telefono.value;c.detalle=detalle.value;
 }else{
  clientes.push({id:Date.now(),nombre:nombre.value,telefono:telefono.value,detalle:detalle.value});
 }
 localStorage.setItem("clientes",JSON.stringify(clientes));
 modalCliente.style.display="none"; editId=null; render();
}

function edit(id){
  editId=id;
  let c=clientes.find(c=>c.id===id);
  nombre.value=c.nombre; telefono.value=c.telefono; detalle.value=c.detalle;
  modalCliente.style.display="block";
}
function del(id){
  clientes=clientes.filter(c=>c.id!==id);
  localStorage.setItem("clientes",JSON.stringify(clientes));
  render();
}

// Cerrar modal al clicar en la "X"
closeCliente.onclick = () => modalCliente.style.display = "none";

// Cerrar modal al clicar en "Cancelar"
cancelCliente.onclick = () => modalCliente.style.display = "none";

// También cerrar al clicar fuera del modal
window.onclick = (e) => {
  if(e.target == modalCliente) modalCliente.style.display = "none";
};
function render(){
  tablaClientes.innerHTML = "";

  clientes.forEach(c => {
    tablaClientes.innerHTML += `<tr>
      <td>${c.nombre}</td>
      <td>${c.telefono}</td>
      <td>${c.detalle}</td>
      <td>
        <button onclick="edit(${c.id})">✏️</button>
        <button onclick="del(${c.id})">🗑</button>
      </td>
    </tr>`;
  });

  // Actualizar total
  document.getElementById("totalClientes").textContent = `Total Clientes: ${clientes.length}`;
}
