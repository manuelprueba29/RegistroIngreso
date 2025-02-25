//como hacer para que una vez alla sido registrado por ese día 
//Futronic FS80H/FS88H, SecuGen Hamster Pro 20
//=IMAGE("https://quickchart.io/barcode?text=" & A2 & "&width=300&height=100&format=png&type=code128")
//=IMAGE("https://quickchart.io/barcode?text=" & A2 & "&width=300&height=100&format=png&type=code128&addText=true&textSize=20&textMargin=10")

const SPREADSHEET_ID="1g1ooF-btFbmVnc1W_RueL3RNasGaGacQSdTh66A9Nrg";
const VALID_TOKEN = "abc123secureToken"; // Puedes generar uno más seguro


function doGet(e) {
  const page = e.parameter.page || 'PagPrincipal'; // Carga 'PagPrincipal' si no se especifica una página
  const token= e.parameter.token;

  Logger.log(`Cargando la página: ${page}`);

  if(page == 'PagSecundaria' && !isValidToken(token)){

        return HtmlService.createHtmlOutput("Acceso denegado. Debe autenticarse para ver esta página.");
  }
  

  try {
    return HtmlService.createTemplateFromFile(page).evaluate()
      .setTitle('Sistema de Monitoreo')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    Logger.log(`Error al cargar la página: ${error.message}`);
    return HtmlService.createHtmlOutput(`Error: La página "${page}" no existe.`);
  }
}


// Generar un token único
function generarTokenUnico() {
  const token = Utilities.getUuid(); // Genera un token único
  const cache = CacheService.getUserCache(); // Cache específico para el usuario
  cache.put(token, "activo", 36000); // Token válido por 5 minutos (300 segundos)
  return token;
}


/** 
function isValidToken(token) {
  return token === VALID_TOKEN;
}
*/

// Validar el token y asegurarse de que solo se use una vez
function isValidToken(token) {
  const cache = CacheService.getUserCache();
  return estadoToken = cache.get(token)=="activo";
}



// Cargar empleados en caché
function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** 
function loadEmpleadosData() {
  const cache = CacheService.getScriptCache(); // Cache para toda la ejecución
  
  let empleadosJSON = cache.get("empleadosData"); // Intenta obtener los datos almacenados

  if (!empleadosJSON) {
    // Si no está en cache, lee desde la hoja y lo guarda
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const empleadosSheet = ss.getSheetByName("Empleados");
    const empleadosData = empleadosSheet.getDataRange().getValues();

    const empleadosMap = new Map(empleadosData.map(row => [
      row[0].toString(), // Cédula como clave
      { cedula: row[0].toString(), nombre: row[1], area: row[2], jefe: row[3] }
    ]));

    empleadosJSON = JSON.stringify(Object.fromEntries(empleadosMap)); // Convertir el Map a JSON
    cache.put("empleadosData", empleadosJSON, 3600); // Guardar en cache por 1 hora (3600 segundos)
  }


  return new Map(Object.entries(JSON.parse(empleadosJSON))); // Devolver datos en formato Map
}
*/

function loadEmpleadosData() {
  const cache = CacheService.getScriptCache();
  let empleadosMap;

  const empleadosJSON = cache.get("empleadosData");
  Logger.log("Datos del caché: " + empleadosJSON);  // Verifica el formato

  if (empleadosJSON) {
    try {
      const empleadosArray = JSON.parse(empleadosJSON);

      // Asegúrate de que sea un array antes de crear el Map
      if (Array.isArray(empleadosArray)) {
        empleadosMap = new Map(empleadosArray);
      } else {
        throw new Error("Los datos del caché no están en el formato correcto.");
      }
    } catch (error) {
      Logger.log("Error al parsear el JSON del caché: " + error.message);
      cache.remove("empleadosData"); // Limpia la caché si hay un problema
      return loadEmpleadosData();    // Vuelve a cargar desde la hoja
    }
  } else {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const empleadosSheet = ss.getSheetByName("Empleados");
    const empleadosData = empleadosSheet.getDataRange().getValues();

    empleadosMap = new Map();
    empleadosData.forEach(row => {
      const cedula = row[0]?.toString();
      if (cedula) {
        empleadosMap.set(cedula, {
          cedula: cedula,
          nombre: row[1] || "N/A",
          area: row[2] || "N/A",
          jefe: row[3] || "N/A"
        });
      }
    });

    // Guarda correctamente como un array de pares clave-valor
    cache.put("empleadosData", JSON.stringify(Array.from(empleadosMap.entries())), 3600);
  }

  return empleadosMap;
}




// Actualizar caché de empleados
  function actualizarCache() {
  const cache = CacheService.getScriptCache();
  cache.remove("empleadosData"); // Elimina los datos en memoria
  loadEmpleadosData(); // Carga nuevamente los datos en cache
  return "Cache de empleados actualizado.";
}


/** 
// Función para registrar ingreso
function registrarIngresogs(cedula) {
  const empleadosMap = loadEmpleadosData(); // Cargar los datos desde la memoria cache
  const empleado = empleadosMap.get(cedula); // Buscar en el Map sin acceder a Google Sheets

  if (!empleado) {
    throw new Error("Cédula no encontrada en la hoja de empleados.");
    
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const registroSheet = ss.getSheetByName("RegistroIngreso");
  
  // Validación para evitar duplicados por el mismo día
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd").toString();
  const registros = registroSheet.getDataRange().getValues();

  //const existeHoy = registros.some(row => row[1].toString() === cedula && row[5] === hoy);


  // Buscar si ya hay un registro hoy y obtener la hora del registro anterior
  //let horaRegistroAnterior = "N/A"; // Valor predeterminado en caso de que no se encuentre

  const existeHoy = registros.some(row => {
    // Asegúrate de que la fecha esté en el formato correcto para comparar
    const fechaRegistro = row[5] ? Utilities.formatDate(new Date(row[5]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null;
    return row[1].toString() === cedula && fechaRegistro === hoy;
  });
  

  Logger.log(`hoy: ${hoy}, tipo: ${typeof hoy}`);
  Logger.log(`existenciahoy: ${existeHoy}, horaRegistroAnterior: `);
  

  if (existeHoy) {
    throw new Error(`${empleado.nombre} Ya tiene un registro para hoy (${hoy}). Su hora de registro fue a las .`);
  }

  // Agregar el nuevo registro
  const fechaIngreso = hoy;
  const horaIngreso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss");
  const idSolicitud = Date.now();

  registroSheet.appendRow([
    idSolicitud, empleado.cedula, empleado.nombre, empleado.jefe, empleado.area, fechaIngreso, horaIngreso
  ]);

  return `Ingreso registrado correctamente para ${empleado.nombre}.`;

}

*/

// Función para registrar ingreso
function registrarIngresogs(cedula) {
  const empleadosMap = loadEmpleadosData(); // Cargar los datos desde la memoria cache
  const empleado = empleadosMap.get(cedula); // Buscar en el Map sin acceder a Google Sheets

  if (!empleado) {
    throw new Error("Cédula no encontrada en la hoja de empleados.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const registroSheet = ss.getSheetByName("RegistroIngreso");
  
  // Validación para evitar duplicados por el mismo día
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd").toString();
  const registros = registroSheet.getDataRange().getDisplayValues(); // Obtener valores visibles (formateados)

  // Buscar si ya hay un registro hoy y obtener la hora del registro anterior
  const registroHoy = registros.find(row => {
    const fechaRegistro = row[5] ? row[5] : null; // Columna de fecha (formato texto)
    return row[1].toString() === cedula && fechaRegistro === hoy;
  });

  Logger.log(`hoy: ${hoy}, tipo: ${typeof hoy}`);
  Logger.log(`existenciahoy: ${registroHoy}, horaRegistroAnterior: `);

  if (registroHoy) {
    const horaRegistroAnterior = registroHoy[6]; // Columna de la hora de registro
    throw new Error(`${empleado.nombre} ya tiene un registro para hoy (${hoy}). Su hora de registro fue a las ${horaRegistroAnterior}.`);
  }

  // Agregar el nuevo registro
  const fechaIngreso = hoy;
  const horaIngreso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss");
  const idSolicitud = Date.now();

  registroSheet.appendRow([
    idSolicitud, empleado.cedula, empleado.nombre, empleado.jefe, empleado.area, fechaIngreso, horaIngreso
  ]);

  return `Ingreso registrado correctamente para ${empleado.nombre}.`;
}


//---------------------------------- segunda parte -------------------------------------------------------------------

// Funciones relacionadas con la lógica de PagSecundaria
function getHistorialPorCedula(cedula) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const registroSheet = ss.getSheetByName("RegistroIngreso");
    const data = registroSheet.getDataRange().getDisplayValues();

    // Filtrar y transformar los datos
    const registros = data
      .slice(1) // Omitir encabezados
      .filter((row) => row[1].toString() === cedula) // Filtrar por cédula
      .map((row) => {
        // Validar fechas
        //const fechaIngreso = parseDate(row[4]);// Devuelve solo la fecha
       
        Logger.log(`Valor de HoraIngreso (row[5]): ${row[5]}`);

        return {
          documento: row[1].toString(), // Convertir documento a cadena
          nombre: row[2]?.trim() || "N/A", // Limpieza de texto
          jefeDirecto: row[3]?.trim() || "N/A", // Limpieza de texto
          area:row[4]?.trim() || "N/A",
          fechaIngreso: row[5],
          //fechaIngreso: row[4] ? Utilities.formatDate(new Date(row[4]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "Fecha no válida", // Formatear fecha
          horaIngreso: row[6] 
          //horaIngreso: parseTime(row[5]) || "Hora no válida", // Validar y procesar la hora
        };
      });

    Logger.log(registros); // Registra los datos para depuración
    return registros || []; // Devuelve un array vacío si no hay registros
  } catch (error) {
    Logger.log(`Error en getHistorialPorCedula: ${error.message}`);
    throw new Error(`Error al obtener el historial: ${error.message}`);
  }
}





function getHistorialPorCedulaYMes(cedula, mes) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const registroSheet = ss.getSheetByName("RegistroIngreso");
  const data = registroSheet.getDataRange().getDisplayValues(); // Lee valores como texto

  const registros = data.filter((row) => {
    // Filtra por cédula y mes (YYYY-MM)
    const fechaIngresoMes = row[5].substring(0, 7); // Obtiene el mes de la fecha (YYYY-MM)

    // Log para depuración
    Logger.log(`fechaIngresoMes: ${fechaIngresoMes}, Tipo: ${typeof fechaIngresoMes}`);
    Logger.log(`Row[5]: ${row[5]}, Tipo: ${typeof row[5]}`);

    return row[1] === cedula && fechaIngresoMes === mes;
  });

  return registros.map((row) => ({
    documento: row[1],
    nombre: row[2],
    jefeDirecto: row[3],
    area:row[4], // area 
    fechaIngreso: row[5], // Fecha tal como aparece en la hoja
    horaIngreso: row[6], // Hora tal como aparece en la hoja
  }));
}

function getHistorialPorDia(dia) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const registroSheet = ss.getSheetByName("RegistroIngreso");
        const data = registroSheet.getDataRange().getDisplayValues(); // Leer valores como texto

        // Filtrar los registros que coincidan con la fecha seleccionada (YYYY-MM-DD)
        const registros = data.filter((row) => row[5] === dia);

        // Transformar los registros en objetos para enviar a la interfaz
        return registros.map((row) => ({
            documento: row[1],
            nombre: row[2],
            jefeDirecto: row[3],
            area: row[4], 
            fechaIngreso: row[5], 
            horaIngreso: row[6], 
        }));
    } catch (error) {
        Logger.log(`Error en getHistorialPorDia: ${error.message}`);
        throw new Error(`Error al obtener los registros del día: ${error.message}`);
    }
}


// Generar códigos de barras para cédulas
function generarCodigosDeBarras() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Empleados"); // Asegúrate de que el nombre es correcto

  const lastRow = sheet.getLastRow();
  const datos = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // Obtener cédulas desde A2:A

  for (let i = 0; i < datos.length; i++) {
    let cedula = datos[i][0];
    if (!cedula) continue;

    let url = `https://quickchart.io/barcode?text=${cedula}&width=300&height=100&format=png&type=code128&addText=true&textSize=16&textMargin=10`;
    
    sheet.getRange(i + 2, 5).setFormula(`=IMAGE("${url}")`); // Insertar imagen en columna E
  }

  SpreadsheetApp.getUi().alert("Códigos de barras generados correctamente.");
}


function exportarDatosAPDF(data) {
  if (!data || data.length === 0) {
    Logger.log("❌ No hay datos para exportar.");
    throw new Error("No hay datos disponibles para exportar.");
  }

  Logger.log("📌 Datos recibidos:", JSON.stringify(data));

  // Crear un documento en Google Docs
  const doc = DocumentApp.create("Historial de Ingresos");
  const body = doc.getBody();

  // Agregar un título
  body.appendParagraph("Historial de Ingresos")
      .setHeading(DocumentApp.ParagraphHeading.TITLE)
      .setBold(true)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("\n"); // Agregar un espacio antes de la tabla

  // Crear tabla con encabezados
  const headers = ["Documento", "Nombre", "Jefe Directo", "Área", "Fecha Ingreso", "Hora Ingreso"];
  let table = body.appendTable();

  if (!table) {
    Logger.log("❌ No se pudo crear la tabla en el documento.");
    throw new Error("Error al crear la tabla en el documento.");
  }

  // Agregar encabezados
  const headerRow = table.appendTableRow();
  headers.forEach(header => {
    headerRow.appendTableCell(header).setBold(true);
  });

  // Agregar filas con datos
  data.forEach(row => {
    if (Array.isArray(row)) {
      Logger.log(`📝 Agregando fila: ${JSON.stringify(row)}`);

      const tableRow = table.appendTableRow();
      row.forEach(cell => {
        const cellText = cell ? String(cell).trim() : "N/A";
        Logger.log(`➡️ Agregando celda: ${cellText}`);
        tableRow.appendTableCell(cellText);
      });

    } else {
      Logger.log("⚠️ Advertencia: Se encontró un dato que no es un array:", JSON.stringify(row));
    }
  });

  // Forzar guardado del documento antes de la conversión a PDF
  doc.saveAndClose();
  Utilities.sleep(2000); // Espera breve para asegurar que el documento se guarda

  // Convertir a PDF
  const docId = doc.getId();
  const pdfFile = DriveApp.getFileById(docId).getAs('application/pdf');
  const folder = DriveApp.getRootFolder();
  const newPdfFile = folder.createFile(pdfFile).setName("HistorialIngresos.pdf");

  Logger.log("✅ PDF generado en:", newPdfFile.getUrl());

  return newPdfFile.getUrl();
}


/** 
function exportarDatosAPDF(data) {
  if (!data || data.length === 0) {
    Logger.log("❌ No hay datos para exportar.");
    throw new Error("No hay datos disponibles para exportar.");
  }

  Logger.log("📌 Datos recibidos:", JSON.stringify(data));

  // Crear un documento en Google Docs
  const doc = DocumentApp.create("Historial de Ingresos");
  const body = doc.getBody();

  // Agregar un título centrado
  body.appendParagraph("Historial de Ingresos")
      .setHeading(DocumentApp.ParagraphHeading.TITLE)
      .setBold(true)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph("\n"); // Espacio antes de la tabla

  // Crear tabla con encabezados
  const headers = ["Documento", "Nombre", "Jefe Directo", "Área", "Fecha Ingreso", "Hora Ingreso"];
  let table = body.appendTable();
  
  // Agregar encabezados como fila en la tabla
  let headerRow = table.appendTableRow();
  headers.forEach(header => {
    headerRow.appendTableCell(header).setBold(true);
  });

  // Agregar filas con datos
  data.forEach(row => {
    if (Array.isArray(row)) {
      Logger.log(`📝 Agregando fila: ${JSON.stringify(row)}`);

      const tableRow = table.appendTableRow();

      row.forEach(cell => {
        let cellText = cell ? cell.toString().trim() : "N/A"; // Convertir a String para evitar errores

        // Agregar saltos de línea para evitar desbordamiento
        if (cellText.length > 15) {
          cellText = cellText.replace(/(.{15})/g, "$1\n");
        }

        tableRow.appendTableCell(cellText); // Agregar celda correctamente
      });

    } else {
      Logger.log("⚠️ Advertencia: Se encontró un dato que no es un array:", JSON.stringify(row));
    }
  });

  // Forzar guardado del documento antes de la conversión a PDF
  doc.saveAndClose();
  Utilities.sleep(2000); // Espera breve para asegurar que el documento se guarda

  // Convertir a PDF
  const docId = doc.getId();
  const pdfFile = DriveApp.getFileById(docId).getAs('application/pdf');
  const folder = DriveApp.getRootFolder();
  const newPdfFile = folder.createFile(pdfFile).setName("HistorialIngresos.pdf");

  Logger.log("✅ PDF generado en:", newPdfFile.getUrl());

  return newPdfFile.getUrl();
}
*/


