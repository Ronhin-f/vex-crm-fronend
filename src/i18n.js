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
        dashboard: "Dashboard",
        clients: "Clientes",
        orders: "Compras",
        tasks: "Tareas",
        pipeline: "Pipeline",
        kanbanTasks: "Kanban tareas",
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
        estimate: "Estimate",
        testDispatch: "Probar dispatch",
        close: "Cerrar",
        ok: "OK",
        cancel: "Cancelar",
      },

      common: {
        email: "Email",
        phone: "Teléfono",
        source: "Origen",
        assignee: "Responsable",
        noData: "Sin datos",
        loading: "Cargando…",
        stages: {
          "Incoming Leads": "Leads entrantes",
          "Qualified": "Calificado",
          "Bid/Estimate Sent": "Presupuesto enviado",
          "Won": "Ganado",
          "Lost": "Perdido",
        },
        taskStates: {
          todo: "Por hacer",
          doing: "En curso",
          waiting: "En espera",
          done: "Hecho",
        },
        badges: {
          estimate: "Estimate",
          noDue: "Sin vencimiento",
          dueAt: "Vence:",
        },
      },

      dashboard: {
        title: "Vex CRM — Dashboard",
        hello: "Hola, {{email}}",
      },

      metrics: {
        clients: "Clientes",
        tasks: "Tareas",
        followups7d: "Seguimientos (7 días)",
      },

      cards: {
        topRecentClients: "Top clientes recientes",
        noRecentClients: "No hay clientes recientes.",
        upcoming7d: "Próximos 7 días",
        noUpcoming: "Sin seguimientos próximos.",
        dueAt: "Vence:",
      },

      pipeline: {
        title: "Pipeline — Clientes",
        empty: "Sin tarjetas",
        movedTo: "Movido a {{stage}}",
      },

      kanbanTasks: {
        title: "Kanban — Tareas",
      },

      clients: {
        title: "Clientes",
        form: {
          name: "Nombre *",
          stage: "Stage",
          email: "Email",
          phone: "Teléfono",
          assignee: "Assignee (email)",
          dueDate: "Due Date",
          source: "Origen",
          estimateUrl: "Estimate (URL)",
          contactInfo: "Información de contacto",
          add: "Agregar",
          upload: "Subir archivo",
        },
        list: {
          none: "No hay clientes.",
          viewEstimate: "Ver estimate",
          prompts: {
            assign: "Assignee (email):",
            due: "Due date (YYYY-MM-DD HH:mm):",
            estimateUrl: "URL de Estimate:",
          },
        },
        toasts: {
          loadError: "Error al cargar clientes",
          created: "Cliente creado",
          cannotCreate: "No se pudo crear el cliente",
          estimateUploaded: "Estimate subido",
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
        title: "🛒 Lista de Compras",
        fields: {
          product: "Producto",
          quantity: "Cantidad",
          note: "Observación",
        },
        interpretPlaceholder: "Ej: 3 jeans y 2 celulares",
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
        placeholders: {
          webhook: "https://hooks.slack.com/services/…",
        },
        tips: {
          dispatchNote: "Tip: el dispatch manda los recordatorios cuyo enviar_en sea ≤ ahora.",
        },
        toasts: {
          saved: "Webhook guardado",
          cannotSave: "No se pudo guardar",
          dispatchOk: "Dispatch OK: {{n}} enviados",
          dispatchError: "No se pudo probar",
        },
        buttons: {
          save: "Guardar",
          test: "Probar dispatch",
        },
      },
    },
  },

  en: {
    translation: {
      app: { brand: "Vex CRM" },

      nav: {
        dashboard: "Dashboard",
        clients: "Clients",
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
      },

      common: {
        email: "Email",
        phone: "Phone",
        source: "Source",
        assignee: "Assignee",
        noData: "No data",
        loading: "Loading…",
        stages: {
          "Incoming Leads": "Incoming Leads",
          "Qualified": "Qualified",
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
          noDue: "No due date",
          dueAt: "Due:",
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
      },

      cards: {
        topRecentClients: "Top recent clients",
        noRecentClients: "No recent clients.",
        upcoming7d: "Next 7 days",
        noUpcoming: "No upcoming follow-ups.",
        dueAt: "Due:",
      },

      pipeline: {
        title: "Pipeline — Clients",
        empty: "No cards",
        movedTo: "Moved to {{stage}}",
      },

      kanbanTasks: {
        title: "Kanban — Tasks",
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
          cannotCreate: "Could not create task",
          completed: "Task completed",
          cannotComplete: "Could not complete task",
          deleted: "Task deleted",
          cannotDelete: "Could not delete task",
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
        placeholders: {
          webhook: "https://hooks.slack.com/services/…",
        },
        tips: {
          dispatchNote: "Tip: dispatch sends reminders with enviar_en ≤ now.",
        },
        toasts: {
          saved: "Webhook saved",
          cannotSave: "Could not save",
          dispatchOk: "Dispatch OK: {{n}} sent",
          dispatchError: "Could not test",
        },
        buttons: {
          save: "Save",
          test: "Test dispatch",
        },
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

// Persistir cambio de idioma
i18n.on("languageChanged", (lng) => {
  try { localStorage.setItem("vex_lang", lng); } catch {}
});

export default i18n;
