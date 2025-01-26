//como hacer para que una vez alla sido registrado por ese día 
const SPREADSHEET_ID="1g1ooF-btFbmVnc1W_RueL3RNasGaGacQSdTh66A9Nrg";

function doGet(e) {
  const page = e.parameter.page || 'PagPrincipal'; // Carga 'PagPrincipal' si no se especifica una página
  Logger.log(`Cargando la página: ${page}`);
  
  try {
    return HtmlService.createTemplateFromFile(page).evaluate()
      .setTitle('Sistema de Monitoreo')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    Logger.log(`Error al cargar la página: ${error.message}`);
    return HtmlService.createHtmlOutput(`Error: La página "${page}" no existe.`);
  }
}


function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function registrarIngresogs(cedula) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // Reemplaza por el ID de tu hoja
  const empleadosSheet = ss.getSheetByName("Empleados");
  const registroSheet = ss.getSheetByName("RegistroIngreso");

  const empleadosData = empleadosSheet.getDataRange().getValues();

  const empleadosMap = new Map(empleadosData.map(row => [row[0].toString(), row])); // Mapa {cedula: fila}
  const empleado =  empleadosMap.get(cedula);

  //const empleado = empleadosData.find(row => row[0].toString() === cedula); // Busca la cédula en la columna A (índice 0)

  if (!empleado) {
    throw new Error("Cédula no encontrada en la hoja de empleados.");
  }

  // Validación para evitar duplicados por el mismo día
  const [cedulaa, nombre, area, jefe] = empleado; // Extrae datos de la fila correspondiente
  const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const registros = registroSheet.getDataRange().getValues();

  const existeHoy = registros.some(row => {
    // Asegúrate de que la fecha esté en el formato correcto para comparar
    const fechaRegistro = row[5] ? Utilities.formatDate(new Date(row[5]), Session.getScriptTimeZone(), "yyyy-MM-dd") : null;
    return row[1].toString() === cedula && fechaRegistro === hoy;
  });


  //const existeHoy = registros.some(row => row[1].toString() === cedula && row[5] === hoy);

  if (existeHoy) {
    throw new Error(`${nombre} Ya existe un registro para la cédula ${cedulaa} en el día ${hoy}.`);
  }

  if (empleado) {
    //const [cedula, nombre, area, jefe] = empleado; // Extrae datos de la fila correspondiente
    const fechaIngreso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); // Fecha y hora actual
    const horaIngreso = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss"); // Solo la hora como texto
    const idSolicitud = Date.now(); // Genera un ID único basado en el timestamp

    // Agrega una nueva fila en RegistroIngreso
    registroSheet.appendRow([
      idSolicitud,
      cedula,
      nombre,
      jefe,
      area,
      fechaIngreso, // Fecha en formato yyyy-MM-dd
      horaIngreso,  // Hora en formato HH:mm:ss como string
      //fechaIngreso.split(' ')[0],
      //fechaIngreso.split(' ')[1],
    ]);
  
    return `Ingreso registrado correctamente para ${nombre}.`;
  } else {
    throw new Error("Cédula no encontrada en la hoja de empleados.");
  }
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













