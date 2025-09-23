// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Detección simple: guardado o navegador
function detectLang() {
  try {
    const saved = localStorage.getItem("vex_lang");
    if (saved) return saved;
  } catch {}
  if (typeof navigator !== "undefined") {
    const nav = (navigator.language || "es").toLowerCase();
    if (nav.startsWith("en")) return "en";
  }
  return "es";
}

export const SUPPORTED_LANGS = ["es", "en"];

const resources = {
  es: {
    translation: {
      app: { brand: "Vex CRM" },

      nav: {
        dashboard: "Tablero",
        clients: "Clientes",
        projects: "Proyectos",
        providers: "Subcontratistas",
        orders: "Compras",
        tasks: "Tareas",
        pipeline: "Pipeline",
        kanbanTasks: "Kanban de tareas",
        settings: "Ajustes",
      },

      actions: {
        logout: "Salir",
        changeLanguage: "Cambiar idioma",
        add: "Agregar",
        save: "Guardar",
        update: "Actualizar",
        delete: "Eliminar",
        assign: "Asignar",
        due: "Vencimiento",
        upload: "Subir",
        estimate: "Presupuesto",
        testDispatch: "Probar envío",
        close: "Cerrar",
        ok: "OK",
        cancel: "Cancelar",
        clear: "Limpiar",
        refreshInsights: "Actualizar insights",
        dispatchNow: "Despachar avisos ahora",
        loading: "Cargando...",
        sending: "Enviando...",
        sentSummary: "{{ok}} enviados, {{err}} con error",
      },

      errors: {
        permission: "No tenés permisos para ejecutar el envío.",
        genericSend: "No se pudieron despachar los avisos.",
        generic: "Ocurrió un error.",
        network: "Error de red",
      },

      common: {
        email: "Email",
        phone: "Teléfono",
        source: "Origen",
        assignee: "Responsable",
        unassigned: "Sin asignar",
        noData: "Sin datos",
        loading: "Cargando…",
        contact: "Contacto",
        followup: "Seguimiento",
        notes: "Notas",
        createdAt: "Creado",
        stages: {
          "Incoming Leads": "Leads entrantes",
          "Unqualified": "No calificados",
          "Qualified": "Calificados",
          "Follow-up Missed": "Seguimiento perdido",
          "Bid/Estimate Sent": "Presupuesto enviado",
          "Won": "Ganados",
          "Lost": "Perdidos",
        },
        taskStates: {
          todo: "Por hacer",
          doing: "En curso",
          waiting: "En espera",
          done: "Hecha",
        },
        badges: {
          estimate: "Presupuesto",
          noEstimate: "Sin presupuesto",
          noDue: "Sin vencimiento",
          noDueShort: "Sin venc.",
          dueAt: "Vence:",
          due: "Vence",
          overdue: "Vencido",
          dueToday: "Vence hoy",
        },
        sources: {
          Outreach: "Prospección",
          "Building Connected": "Building Connected",
          "Building Connected ITB": "Building Connected (ITB)",
          "Blue Book": "Blue Book",
          "Blue Book ITB": "Blue Book (ITB)",
          Gmail: "Gmail",
          Email: "Email",
          Website: "Sitio web",
          Referral: "Referencia",
          Unknown: "Desconocido",
        },
      },

      dashboard: {
        title: "Vex CRM — Tablero",
        hello: "Hola, {{email}}",
      },

      metrics: {
        clients: "Clientes",
        tasks: "Tareas",
        followups7d: "Seguimientos (7 días)",
        overdue: "Vencidas",
      },

      cards: {
        topRecentClients: "Clientes recientes",
        noRecentClients: "No hay clientes recientes.",
        upcoming7d: "Próximos 7 días",
        noUpcoming: "Sin seguimientos próximos.",
        dueAt: "Vence:",
        insights: "Insights del negocio",
      },

      insights: {
        baseline: "Línea base",
        empty: "Aún no hay recomendaciones. Cargá clientes/tareas y volvé a intentar.",
      },

      pipeline: {
        title: "Pipeline — Clientes",
        empty: "Sin tarjetas",
        movedTo: "Movido a {{stage}}",
        filters: {
          searchPlaceholder: "Buscar (nombre, email, teléfono, empresa)",
          sourceAll: "Origen: todos",
          assigneeAll: "Responsable: todos",
          onlyDue: "Solo con seguimiento",
          title: "Filtros",
        },
        help: {
          cardHint: "Click para ver detalle. Arrastrá para mover de etapa.",
          lastStage: "Última etapa",
          moveNext: "Mover a la siguiente etapa",
        },
        modals: {
          contact: "Contacto",
          tracking: "Seguimiento",
        },
        toasts: {
          loadError: "No pude cargar el Kanban de clientes",
          moved: "Movido a {{stage}}",
          moveError: "No pude mover el cliente",
        },
      },

      kanbanTasks: {
        title: "Kanban — Tareas",
        toasts: {
          loadError: "No pude cargar el Kanban de tareas",
          moved: "Tarea movida",
          moveError: "No pude mover la tarea",
        },
        help: {
          drag: "Arrastrá para mover de columna",
          nextCol: "Mover a la siguiente columna",
          markDone: "Marcar como hecha",
        },
      },

      clients: {
        title: "Clientes",
        form: {
          name: "Nombre *",
          stage: "Etapa",
          email: "Email",
          phone: "Teléfono",
          assignee: "Responsable (email)",
          dueDate: "Vence",
          source: "Origen",
          estimateUrl: "Presupuesto (URL)",
          contactInfo: "Información de contacto",
          add: "Agregar",
          upload: "Subir archivo",
        },
        list: {
          none: "No hay clientes.",
          viewEstimate: "Ver presupuesto",
          prompts: {
            assign: "Responsable (email):",
            due: "Fecha de vencimiento (YYYY-MM-DD HH:mm):",
            estimateUrl: "URL del presupuesto:",
          },
        },
        toasts: {
          loadError: "Error al cargar clientes",
          created: "Cliente creado",
          cannotCreate: "No se pudo crear el cliente",
          estimateUploaded: "Presupuesto subido",
          moved: "Cliente movido",
          moveError: "No pude mover el cliente",
          updated: "Actualizado",
          updateError: "No pude actualizar",
        },
      },

      tasks: {
        title: "✅ Tareas",
        listEmpty: "Sin tareas.",
        addForm: {
          title: "Título",
          description: "Descripción (opcional)",
          client: "Cliente",
          dueDate: "Vence",
          add: "Agregar",
        },
        filters: {
          placeholder: "Filtrar por texto/cliente…",
        },
        toasts: {
          loadError: "No se pudieron cargar tareas/clientes",
          created: "Tarea creada",
          cannotCreate: "No se pudo crear la tarea",
          completed: "Tarea completada",
          cannotComplete: "No se pudo completar",
          deleted: "Tarea eliminada",
          cannotDelete: "No se pudo eliminar",
        },
      },

      compras: {
        title: "🛒 Lista de compras",
        fields: {
          product: "Producto",
          quantity: "Cantidad",
          note: "Observación",
        },
        interpretPlaceholder: "Ej.: 3 jeans y 2 celulares",
        searchPlaceholder: "Buscar en la lista…",
        empty: "No hay ítems para mostrar",
        toasts: {
          loadError: "Error al cargar la lista",
          added: "Producto agregado",
          cannotAdd: "No se pudo agregar el producto",
          updated: "Producto actualizado",
          cannotUpdate: "No se pudo editar",
          deleted: "Producto eliminado",
          cannotDelete: "No se pudo eliminar",
          interpretError: "No se pudo interpretar el mensaje",
          interpretOk: "Mensaje interpretado",
          invalidData: "Datos inválidos",
          requireProductQty: "Producto y cantidad válida son requeridos",
        },
        confirmDelete: "¿Eliminar este producto?",
      },

      settings: {
        title: "⚙️ Integraciones",
        slackWebhook: "Slack Incoming Webhook",
        placeholders: { webhook: "https://hooks.slack.com/services/…" },
        tips: { dispatchNote: "Tip: el despacho manda recordatorios cuyo enviar_en sea ≤ ahora." },
        toasts: {
          saved: "Webhook guardado",
          cannotSave: "No se pudo guardar",
          dispatchOk: "Despacho OK: {{n}} enviados",
          dispatchError: "No se pudo probar",
        },
        buttons: { save: "Guardar", test: "Probar envío" },
      },

      analytics: {
        contactability: "Contactabilidad",
        firstTouchP50: "Primer contacto (p50)",
        firstTouchAvg: "Primer contacto (prom)",
        leadsRange: "Leads (período)",
        qualified: "Calificados",
        qualRate: "Tasa",
        uncontactable: "No contactables",
        noFirstTouch: "Sin primer contacto",
        uncategorized: "Sin etapa/pipeline",
        stalledIncoming: "Estancados en Incoming ≥ {{d}} días",
        bySource: "Tasa de ganados por Origen",
        byOwner: "Tasa de ganados por Responsable",
      },
    },
  },

  en: {
    translation: {
      app: { brand: "Vex CRM" },

      nav: {
        dashboard: "Dashboard",
        clients: "Clients",
        projects: "Projects",
        providers: "Subcontractors",
        orders: "Purchases",
        tasks: "Tasks",
        pipeline: "Pipeline",
        kanbanTasks: "Tasks Kanban",
        settings: "Settings",
      },

      actions: {
        logout: "Log out",
        changeLanguage: "Change language",
        add: "Add",
        save: "Save",
        update: "Update",
        delete: "Delete",
        assign: "Assign",
        due: "Due",
        upload: "Upload",
        estimate: "Estimate",
        testDispatch: "Test dispatch",
        close: "Close",
        ok: "OK",
        cancel: "Cancel",
        clear: "Clear",
        refreshInsights: "Refresh insights",
        dispatchNow: "Dispatch notices now",
        loading: "Loading...",
        sending: "Sending...",
        sentSummary: "{{ok}} sent, {{err}} failed",
      },

      errors: {
        permission: "You don't have permission to run the dispatcher.",
        genericSend: "Could not dispatch notices.",
        generic: "Something went wrong.",
        network: "Network error",
      },

      common: {
        email: "Email",
        phone: "Phone",
        source: "Source",
        assignee: "Assignee",
        unassigned: "Unassigned",
        noData: "No data",
        loading: "Loading…",
        contact: "Contact",
        followup: "Follow-up",
        notes: "Notes",
        createdAt: "Created",
        stages: {
          "Incoming Leads": "Incoming Leads",
          "Unqualified": "Unqualified",
          "Qualified": "Qualified",
          "Follow-up Missed": "Follow-up Missed",
          "Bid/Estimate Sent": "Bid/Estimate Sent",
          "Won": "Won",
          "Lost": "Lost",
        },
        taskStates: {
          todo: "To do",
          doing: "Doing",
          waiting: "Waiting",
          done: "Done",
        },
        badges: {
          estimate: "Estimate",
          noEstimate: "No estimate",
          noDue: "No due date",
          noDueShort: "No due",
          dueAt: "Due:",
          due: "Due",
          overdue: "Overdue",
          dueToday: "Due today",
        },
        sources: {
          Outreach: "Outreach",
          "Building Connected": "Building Connected",
          "Building Connected ITB": "Building Connected (ITB)",
          "Blue Book": "Blue Book",
          "Blue Book ITB": "Blue Book (ITB)",
          Gmail: "Gmail",
          Email: "Email",
          Website: "Website",
          Referral: "Referral",
          Unknown: "Unknown",
        },
      },

      dashboard: {
        title: "Vex CRM — Dashboard",
        hello: "Hi, {{email}}",
      },

      metrics: {
        clients: "Clients",
        tasks: "Tasks",
        followups7d: "Follow-ups (7 days)",
        overdue: "Overdue",
      },

      cards: {
        topRecentClients: "Top recent clients",
        noRecentClients: "No recent clients.",
        upcoming7d: "Next 7 days",
        noUpcoming: "No upcoming follow-ups.",
        dueAt: "Due:",
        insights: "Business insights",
      },

      insights: {
        baseline: "Baseline",
        empty: "No recommendations yet. Add clients/tasks and try again.",
      },

      pipeline: {
        title: "Pipeline — Clients",
        empty: "No cards",
        movedTo: "Moved to {{stage}}",
        filters: {
          searchPlaceholder: "Search (name, email, phone, company)",
          sourceAll: "Source: all",
          assigneeAll: "Assignee: all",
          onlyDue: "Only with follow-up",
          title: "Filters",
        },
        help: {
          cardHint: "Click to view details. Drag to move to the next stage.",
          lastStage: "Last stage",
          moveNext: "Move to next stage",
        },
        modals: {
          contact: "Contact",
          tracking: "Follow-up",
        },
        toasts: {
          loadError: "Couldn't load clients Kanban",
          moved: "Moved to {{stage}}",
          moveError: "Couldn't move client",
        },
      },

      kanbanTasks: {
        title: "Kanban — Tasks",
        toasts: {
          loadError: "Couldn't load tasks Kanban",
          moved: "Task moved",
          moveError: "Couldn't move task",
        },
        help: {
          drag: "Drag to move between columns",
          nextCol: "Move to the next column",
          markDone: "Mark as done",
        },
      },

      clients: {
        title: "Clients",
        form: {
          name: "Name *",
          stage: "Stage",
          email: "Email",
          phone: "Phone",
          assignee: "Assignee (email)",
          dueDate: "Due Date",
          source: "Source",
          estimateUrl: "Estimate (URL)",
          contactInfo: "Contact info",
          add: "Add",
          upload: "Upload file",
        },
        list: {
          none: "No clients.",
          viewEstimate: "View estimate",
          prompts: {
            assign: "Assignee (email):",
            due: "Due date (YYYY-MM-DD HH:mm):",
            estimateUrl: "Estimate URL:",
          },
        },
        toasts: {
          loadError: "Failed to load clients",
          created: "Client created",
          cannotCreate: "Could not create client",
          estimateUploaded: "Estimate uploaded",
          moved: "Client moved",
          moveError: "Could not move client",
          updated: "Updated",
          updateError: "Could not update",
        },
      },

      tasks: {
        title: "✅ Tasks",
        listEmpty: "No tasks.",
        addForm: {
          title: "Title",
          description: "Description (optional)",
          client: "Client",
          dueDate: "Due",
          add: "Add",
        },
        filters: {
          placeholder: "Filter by text/client…",
        },
        toasts: {
          loadError: "Failed to load tasks/clients",
          created: "Task created",
          cannotCreate: "Could not create the task",
          completed: "Task completed",
          cannotComplete: "Could not complete",
          deleted: "Task deleted",
          cannotDelete: "Could not delete",
        },
      },

      compras: {
        title: "🛒 Shopping List",
        fields: {
          product: "Product",
          quantity: "Quantity",
          note: "Note",
        },
        interpretPlaceholder: "E.g.: 3 jeans and 2 phones",
        searchPlaceholder: "Search the list…",
        empty: "No items to show",
        toasts: {
          loadError: "Failed to load the list",
          added: "Item added",
          cannotAdd: "Could not add item",
          updated: "Item updated",
          cannotUpdate: "Could not update",
          deleted: "Item deleted",
          cannotDelete: "Could not delete",
          interpretError: "Could not parse the message",
          interpretOk: "Message parsed",
          invalidData: "Invalid data",
          requireProductQty: "Product and valid quantity are required",
        },
        confirmDelete: "Delete this item?",
      },

      settings: {
        title: "⚙️ Integrations",
        slackWebhook: "Slack Incoming Webhook",
        placeholders: { webhook: "https://hooks.slack.com/services/…" },
        tips: { dispatchNote: "Tip: dispatch sends reminders with enviar_en ≤ now." },
        toasts: {
          saved: "Webhook saved",
          cannotSave: "Could not save",
          dispatchOk: "Dispatch OK: {{n}} sent",
          dispatchError: "Could not test",
        },
        buttons: { save: "Save", test: "Test dispatch" },
      },

      analytics: {
        contactability: "Contactability",
        firstTouchP50: "First touch (p50)",
        firstTouchAvg: "First touch (avg)",
        leadsRange: "Leads (period)",
        qualified: "Qualified",
        qualRate: "Rate",
        uncontactable: "Uncontactable",
        noFirstTouch: "No first touch",
        uncategorized: "No stage/pipeline",
        stalledIncoming: "Stalled in Incoming ≥ {{d}} days",
        bySource: "Win rate by Source",
        byOwner: "Win rate by Owner",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: detectLang(),
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  try { localStorage.setItem("vex_lang", lng); } catch {}
});

export default i18n;
