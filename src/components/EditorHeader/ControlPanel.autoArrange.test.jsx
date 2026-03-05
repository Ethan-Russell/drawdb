import React, { createContext } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let tables;
let relationships;
const updateTable = vi.fn();
const setUndoStack = vi.fn();
const setRedoStack = vi.fn();
const setSaveState = vi.fn();

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    initReactI18next: {
      type: "3rdParty",
      init: () => {},
    },
    useTranslation: () => ({
      t: (key) => key,
      i18n: { language: "en" },
    }),
  };
});

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: () => {},
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => [],
}));

vi.mock("html-to-image", () => ({
  toPng: vi.fn(),
  toJpeg: vi.fn(),
  toSvg: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: class MockJsPdf {},
}));

vi.mock("@douyinfe/semi-icons", () => {
  const Icon = () => <span />;
  return {
    IconCaretdown: Icon,
    IconChevronRight: Icon,
    IconChevronLeft: Icon,
    IconChevronUp: Icon,
    IconChevronDown: Icon,
    IconSaveStroked: Icon,
    IconUndo: Icon,
    IconRedo: Icon,
    IconEdit: Icon,
    IconShareStroked: Icon,
  };
});

vi.mock("@douyinfe/semi-ui", () => {
  const Button = ({ children, onClick, disabled, icon }) => (
    <button onClick={onClick} disabled={disabled}>
      {icon}
      {children}
    </button>
  );
  const Divider = () => <span />;
  const Tooltip = ({ children }) => <>{children}</>;
  const Spin = () => <span />;
  const Tag = ({ children }) => <span>{children}</span>;
  const Popconfirm = ({ children }) => <>{children}</>;
  const InputNumber = () => <input />;

  const Dropdown = ({ children }) => <>{children}</>;
  Dropdown.Menu = ({ children }) => <>{children}</>;
  Dropdown.Item = ({ children, onClick, disabled, style }) => (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
  Dropdown.Divider = () => <span />;

  return {
    Button,
    Divider,
    Dropdown,
    InputNumber,
    Tooltip,
    Spin,
    Tag,
    Toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    Popconfirm,
  };
});

vi.mock("../../hooks", () => ({
  useLayout: () => ({
    layout: {
      header: true,
      sidebar: true,
      issues: true,
      toolbar: true,
      dbmlEditor: false,
      readOnly: false,
    },
    setLayout: vi.fn(),
  }),
  useSettings: () => ({
    settings: {
      tableWidth: 200,
      showComments: true,
      mode: "light",
      snapToGrid: false,
      showFieldSummary: true,
      strictMode: false,
    },
    setSettings: vi.fn(),
  }),
  useTransform: () => ({
    transform: { zoom: 1, pan: { x: 0, y: 0 } },
    setTransform: vi.fn(),
  }),
  useDiagram: () => ({
    relationships,
    tables,
    setTables: vi.fn(),
    addTable: vi.fn(),
    updateTable,
    deleteField: vi.fn(),
    deleteTable: vi.fn(),
    updateField: vi.fn(),
    setRelationships: vi.fn(),
    addRelationship: vi.fn(),
    deleteRelationship: vi.fn(),
    updateRelationship: vi.fn(),
    database: "generic",
  }),
  useUndoRedo: () => ({
    undoStack: [],
    redoStack: [],
    setUndoStack,
    setRedoStack,
  }),
  useSelect: () => ({
    selectedElement: { element: "none", id: -1, currentTab: 0, open: false },
    setSelectedElement: vi.fn(),
  }),
  useSaveState: () => ({
    saveState: 0,
    setSaveState,
  }),
  useTypes: () => ({
    types: [],
    addType: vi.fn(),
    deleteType: vi.fn(),
    updateType: vi.fn(),
    setTypes: vi.fn(),
  }),
  useNotes: () => ({
    notes: [],
    setNotes: vi.fn(),
    updateNote: vi.fn(),
    addNote: vi.fn(),
    deleteNote: vi.fn(),
  }),
  useAreas: () => ({
    areas: [],
    setAreas: vi.fn(),
    updateArea: vi.fn(),
    addArea: vi.fn(),
    deleteArea: vi.fn(),
  }),
  useEnums: () => ({
    enums: [],
    setEnums: vi.fn(),
    deleteEnum: vi.fn(),
    addEnum: vi.fn(),
    updateEnum: vi.fn(),
  }),
  useFullscreen: () => ({
    isFullscreen: false,
    setIsFullscreen: vi.fn(),
  }),
}));

vi.mock("../Workspace", () => ({
  IdContext: createContext({ version: null, gistId: null, setGistId: vi.fn() }),
}));

vi.mock("./LayoutDropdown", () => ({
  default: () => <div />,
}));

vi.mock("./SideSheet/Sidesheet", () => ({
  default: () => null,
}));

vi.mock("./Modal/Modal", () => ({
  default: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "diagram-1" }),
    useMatch: () => null,
    useNavigate: () => vi.fn(),
  };
});

import ControlPanel from "./ControlPanel";
import { IdContext } from "../Workspace";

describe("ControlPanel auto arrange button", () => {
  beforeEach(() => {
    updateTable.mockReset();
    setUndoStack.mockReset();
    setRedoStack.mockReset();
    setSaveState.mockReset();

    tables = [
      {
        id: "t1",
        name: "users",
        x: 100,
        y: 100,
        fields: [{ id: "f1" }],
        indices: [],
        color: "#000",
        locked: false,
      },
      {
        id: "t2",
        name: "orders",
        x: 500,
        y: 100,
        fields: [{ id: "f2" }],
        indices: [],
        color: "#000",
        locked: false,
      },
    ];

    relationships = [
      {
        id: "r1",
        startTableId: "t1",
        endTableId: "t2",
      },
    ];
  });

  it("updates table positions when auto arrange is clicked", () => {
    const initialById = new Map(tables.map((t) => [t.id, { x: t.x, y: t.y }]));

    const { container } = render(
      <MemoryRouter>
        <IdContext.Provider
          value={{ version: null, gistId: null, setGistId: vi.fn() }}
        >
          <ControlPanel title="Diagram" setTitle={vi.fn()} lastSaved="now" />
        </IdContext.Provider>
      </MemoryRouter>,
    );

    const icon = container.querySelector("i.fa-wand-magic-sparkles");
    expect(icon).toBeTruthy();

    const button = icon.closest("button");
    expect(button).toBeTruthy();

    fireEvent.click(button);

    expect(updateTable).toHaveBeenCalled();
    const hasMovedCall = updateTable.mock.calls.some(([id, coords]) => {
      const initial = initialById.get(id);
      return initial && (coords.x !== initial.x || coords.y !== initial.y);
    });

    expect(hasMovedCall).toBe(true);
  });
});

