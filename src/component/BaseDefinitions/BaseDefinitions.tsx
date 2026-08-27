"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from "./BaseDefinitions.module.css";

type BaseDefinition = {
  ID: string;
  PID: string | null;
  NameFarsi: string | null;
  Value: number | null;
};

type TreeRow = {
  item: BaseDefinition;
  depth: number;
  hasChildren: boolean;
};

type IconName = "plus" | "search" | "refresh" | "edit" | "trash" | "close" | "layers" | "list" | "chevron";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 0-2 5" /></>,
    edit: <><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.4 2.6 3 3L12 15l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 3h6l1 4H8Z" /><path d="m6 7 1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    layers: <><path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
  } as const;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

async function getResponseMessage(response: Response): Promise<string> {
  try {
    const result = await response.json() as { message?: string };
    return result.message || "عملیات با خطا مواجه شد.";
  } catch {
    return "عملیات با خطا مواجه شد.";
  }
}

function validateDefinition(id: string, nameFarsi: string, value: string): string {
  if (!/^-?\d+$/.test(id.trim())) return "شناسه باید به‌صورت دستی و فقط با عدد وارد شود.";
  if (!nameFarsi.trim()) return "عنوان فارسی را وارد کنید.";
  if (value.trim() && !/^-?\d+$/.test(value.trim())) return "مقدار باید عدد صحیح باشد.";
  return "";
}

export default function BaseDefinitions() {
  const [items, setItems] = useState<BaseDefinition[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [id, setId] = useState("");
  const [pid, setPid] = useState("");
  const [nameFarsi, setNameFarsi] = useState("");
  const [value, setValue] = useState("");

  const [selectedParent, setSelectedParent] = useState<BaseDefinition | null>(null);
  const [childSearchText, setChildSearchText] = useState("");
  const [childFormOpen, setChildFormOpen] = useState(false);
  const [childEditingId, setChildEditingId] = useState<string | null>(null);
  const [childId, setChildId] = useState("");
  const [childNameFarsi, setChildNameFarsi] = useState("");
  const [childValue, setChildValue] = useState("");
  const [childError, setChildError] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/base-definitions", { cache: "no-store" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await getResponseMessage(response));

      const result = await response.json() as { items?: BaseDefinition[] };
      const loadedItems = Array.isArray(result.items) ? result.items : [];
      setItems(loadedItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت اطلاعات انجام نشد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const itemById = useMemo(() => new Map(items.map((item) => [item.ID, item])), [items]);

  const childrenByParent = useMemo(() => {
    const result = new Map<string, BaseDefinition[]>();
    items.forEach((item) => {
      if (item.PID === null || item.PID === "0") return;
      const children = result.get(item.PID) ?? [];
      children.push(item);
      result.set(item.PID, children);
    });
    return result;
  }, [items]);

  const rootItems = useMemo(() => items.filter((item) =>
    item.PID === null || item.PID === "0" || !itemById.has(item.PID)
  ), [itemById, items]);

  const treeRows = useMemo<TreeRow[]>(() => {
    const query = searchText.trim().toLocaleLowerCase("fa-IR");
    const visibleIds = new Set<string>();

    if (query) {
      items.forEach((item) => {
        const matches = item.ID.includes(query)
          || String(item.NameFarsi ?? "").toLocaleLowerCase("fa-IR").includes(query)
          || String(item.Value ?? "").includes(query);
        if (!matches) return;

        let current: BaseDefinition | undefined = item;
        const ancestorIds = new Set<string>();
        while (current && !ancestorIds.has(current.ID)) {
          visibleIds.add(current.ID);
          ancestorIds.add(current.ID);
          current = current.PID && current.PID !== "0" ? itemById.get(current.PID) : undefined;
        }
      });
    }

    const rows: TreeRow[] = [];
    const addRows = (nodes: BaseDefinition[], depth: number, parentPath: Set<string>) => {
      nodes.forEach((item) => {
        if (parentPath.has(item.ID) || (query && !visibleIds.has(item.ID))) return;
        const children = childrenByParent.get(item.ID) ?? [];
        rows.push({ item, depth, hasChildren: children.length > 0 });

        if (query || expandedIds.has(item.ID)) {
          const nextPath = new Set(parentPath);
          nextPath.add(item.ID);
          addRows(children, depth + 1, nextPath);
        }
      });
    };

    addRows(rootItems, 0, new Set());
    return rows;
  }, [childrenByParent, expandedIds, itemById, items, rootItems, searchText]);

  const childItems = useMemo(() => {
    if (!selectedParent) return [];
    const query = childSearchText.trim().toLocaleLowerCase("fa-IR");
    const children = items.filter((item) => item.PID === selectedParent.ID);
    if (!query) return children;

    return children.filter((item) =>
      item.ID.includes(query)
      || String(item.NameFarsi ?? "").toLocaleLowerCase("fa-IR").includes(query)
      || String(item.Value ?? "").includes(query),
    );
  }, [childSearchText, items, selectedParent]);

  const childCount = useCallback((parentId: string) => childrenByParent.get(parentId)?.length ?? 0, [childrenByParent]);

  const toggleExpanded = (itemId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setId("");
    setPid("");
    setNameFarsi("");
    setValue("");
    setError("");
    setFormOpen(true);
  };

  const openEdit = (item: BaseDefinition) => {
    setEditingId(item.ID);
    setId(item.ID);
    setPid(item.PID ?? "");
    setNameFarsi(item.NameFarsi ?? "");
    setValue(item.Value === null ? "" : String(item.Value));
    setError("");
    setFormOpen(true);
  };

  const openChildren = (item: BaseDefinition) => {
    setSelectedParent(item);
    setChildSearchText("");
    setChildFormOpen(false);
    setChildError("");
  };

  const closeChildren = () => {
    if (busy) return;
    setSelectedParent(null);
    setChildFormOpen(false);
    setChildError("");
  };

  const openCreateChild = () => {
    setChildEditingId(null);
    setChildId("");
    setChildNameFarsi("");
    setChildValue("");
    setChildError("");
    setChildFormOpen(true);
  };

  const openEditChild = (item: BaseDefinition) => {
    setChildEditingId(item.ID);
    setChildId(item.ID);
    setChildNameFarsi(item.NameFarsi ?? "");
    setChildValue(item.Value === null ? "" : String(item.Value));
    setChildError("");
    setChildFormOpen(true);
  };

  const saveItem = async () => {
    const validationError = validateDefinition(id, nameFarsi, value);
    if (validationError) {
      setError(validationError);
      return;
    }
    const normalizedPid = pid.trim();
    if (normalizedPid && !/^-?\d+$/.test(normalizedPid)) {
      setError("شناسه والد باید عددی باشد.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/base-definitions", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), pid: normalizedPid || null, nameFarsi: nameFarsi.trim(), value: value.trim() || null }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await getResponseMessage(response));

      setFormOpen(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره اطلاعات انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const saveChild = async () => {
    if (!selectedParent) return;
    const validationError = validateDefinition(childId, childNameFarsi, childValue);
    if (validationError) {
      setChildError(validationError);
      return;
    }

    setBusy(true);
    setChildError("");

    try {
      const response = await fetch("/api/base-definitions", {
        method: childEditingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: childId.trim(), pid: selectedParent.ID, nameFarsi: childNameFarsi.trim(), value: childValue.trim() || null }),
      });

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await getResponseMessage(response));

      setChildFormOpen(false);
      setExpandedIds((current) => new Set(current).add(selectedParent.ID));
      await loadItems();
    } catch (saveError) {
      setChildError(saveError instanceof Error ? saveError.message : "ذخیره زیرموضوع انجام نشد.");
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (item: BaseDefinition, isChild = false) => {
    const confirmed = window.confirm(`${isChild ? "زیرموضوع" : "تعریف"} «${item.NameFarsi || item.ID}» حذف شود؟`);
    if (!confirmed) return;

    setBusy(true);
    if (isChild) setChildError("");
    else setError("");

    try {
      const response = await fetch(`/api/base-definitions?id=${encodeURIComponent(item.ID)}`, { method: "DELETE" });
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(await getResponseMessage(response));

      if (childEditingId === item.ID) setChildFormOpen(false);
      await loadItems();
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "حذف رکورد انجام نشد.";
      if (isChild) setChildError(message);
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.headingCard}>
        <div><span className={styles.eyebrow}>اطلاعات پایه</span><h2>مدیریت تعاریف پایه</h2><p>شاخه‌ها را باز کنید یا برای مشاهده جزئیات و مدیریت زیرموضوعات روی هر ردیف کلیک کنید.</p></div>
        <button className={styles.primaryButton} onClick={openCreate} disabled={busy}><Icon name="plus" />افزودن تعریف جدید</button>
      </section>

      {error && <div className={styles.errorMessage} role="alert">{error}</div>}

      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}><Icon name="search" /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="جستجو در تمام سطوح درخت..." /></label>
          <button className={styles.refreshButton} onClick={() => void loadItems()} disabled={loading || busy} title="بارگذاری مجدد"><Icon name="refresh" />به‌روزرسانی</button>
        </div>

        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ردیف</th><th>شناسه دستی</th><th>عنوان فارسی</th><th>مقدار</th><th>زیرموضوع</th><th className={styles.actionsTitle}>عملیات</th></tr></thead>
            <tbody>
              {loading ? <tr><td className={styles.empty} colSpan={6}>در حال دریافت اطلاعات...</td></tr> : treeRows.length === 0 ? <tr><td className={styles.empty} colSpan={6}>تعریفی برای نمایش پیدا نشد.</td></tr> : treeRows.map(({ item, depth, hasChildren }, index) => (
                <tr className={`${styles.clickableRow} ${depth === 0 ? styles.rootRow : styles.childRow}`} key={item.ID} onClick={() => openChildren(item)}>
                  <td className={styles.muted}>{(index + 1).toLocaleString("fa-IR")}</td>
                  <td><span className={styles.idBadge}>{item.ID}</span></td>
                  <td className={styles.nameCell}>
                    <div className={styles.treeName} style={{ paddingInlineStart: `${depth * 25}px` }}>
                      {hasChildren ? (
                        <button
                          type="button"
                          className={`${styles.treeToggle} ${(searchText.trim() || expandedIds.has(item.ID)) ? styles.expanded : ""}`}
                          onClick={(event) => { event.stopPropagation(); toggleExpanded(item.ID); }}
                          aria-label={`${expandedIds.has(item.ID) ? "بستن" : "باز کردن"} زیرموضوعات ${item.NameFarsi || item.ID}`}
                          aria-expanded={Boolean(searchText.trim()) || expandedIds.has(item.ID)}
                        >
                          <Icon name="chevron" size={15} />
                        </button>
                      ) : <span className={styles.treeLeaf} />}
                      <span>{item.NameFarsi || "—"}</span>
                    </div>
                  </td>
                  <td>{item.Value === null ? <span className={styles.noValue}>—</span> : item.Value.toLocaleString("fa-IR")}</td>
                  <td><button className={styles.childrenButton} onClick={(event) => { event.stopPropagation(); openChildren(item); }}><Icon name="list" size={16} /><span>{childCount(item.ID).toLocaleString("fa-IR")} مورد</span></button></td>
                  <td><span className={styles.actions}><button className={styles.editButton} onClick={(event) => { event.stopPropagation(); openEdit(item); }} disabled={busy} aria-label={`ویرایش ${item.NameFarsi || item.ID}`}><Icon name="edit" size={17} /></button><button className={styles.deleteButton} onClick={(event) => { event.stopPropagation(); void deleteItem(item); }} disabled={busy} aria-label={`حذف ${item.NameFarsi || item.ID}`}><Icon name="trash" size={17} /></button></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.tableFooter}>نمایش {treeRows.length.toLocaleString("fa-IR")} ردیف از {items.length.toLocaleString("fa-IR")} تعریف در ساختار درختی</footer>
      </section>

      {formOpen && (
        <div className={styles.modalBackdrop} onMouseDown={() => !busy && setFormOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="definition-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setFormOpen(false)} disabled={busy} aria-label="بستن"><Icon name="close" /></button>
            <div className={styles.modalHeader}><span><Icon name="layers" /></span><div><h3 id="definition-modal-title">{editingId ? "ویرایش تعریف پایه" : "افزودن تعریف پایه"}</h3><p>شناسه، والد، عنوان فارسی و مقدار را مشخص کنید.</p></div></div>
            <div className={styles.formGrid}>
              <label><span>شناسه دستی <b>*</b></span><input autoFocus={!editingId} value={id} onChange={(event) => setId(event.target.value)} disabled={Boolean(editingId) || busy} inputMode="numeric" placeholder="برای نمونه: 1001" /><small>{editingId ? "شناسه رکورد هنگام ویرایش قابل تغییر نیست." : "این مقدار به‌صورت خودکار تولید نمی‌شود."}</small></label>
              <label><span>شناسه والد</span><input value={pid} onChange={(event) => setPid(event.target.value)} disabled={busy} inputMode="numeric" placeholder="در صورت اصلی بودن خالی بگذارید" /></label>
              <label className={styles.fullField}><span>عنوان فارسی <b>*</b></span><input value={nameFarsi} onChange={(event) => setNameFarsi(event.target.value)} disabled={busy} placeholder="عنوان تعریف پایه" /></label>
              <label><span>مقدار</span><input value={value} onChange={(event) => setValue(event.target.value)} disabled={busy} inputMode="numeric" placeholder="عدد صحیح یا خالی" /></label>
            </div>
            <div className={styles.modalActions}><button className={styles.cancelButton} onClick={() => setFormOpen(false)} disabled={busy}>انصراف</button><button className={styles.primaryButton} onClick={() => void saveItem()} disabled={busy}>{busy ? "در حال ذخیره..." : editingId ? "ثبت تغییرات" : "ثبت تعریف"}</button></div>
          </section>
        </div>
      )}

      {selectedParent && (
        <div className={styles.modalBackdrop} onMouseDown={closeChildren}>
          <section className={`${styles.modal} ${styles.childrenModal}`} role="dialog" aria-modal="true" aria-labelledby="children-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeChildren} disabled={busy} aria-label="بستن"><Icon name="close" /></button>
            <div className={styles.childrenHeader}>
              <div className={styles.modalHeader}><span><Icon name="layers" /></span><div><h3 id="children-modal-title">زیرموضوعات {selectedParent.NameFarsi || selectedParent.ID}</h3><p>شناسه تعریف اصلی: {selectedParent.ID}</p></div></div>
              <button className={styles.primaryButton} onClick={openCreateChild} disabled={busy}><Icon name="plus" />افزودن زیرموضوع</button>
            </div>

            <div className={styles.parentDetails}>
              <div><span>عنوان تعریف</span><p>{selectedParent.NameFarsi || "—"}</p></div>
              <div><span>شناسه</span><p>{selectedParent.ID}</p></div>
              <div><span>مقدار</span><p>{selectedParent.Value === null ? "—" : selectedParent.Value.toLocaleString("fa-IR")}</p></div>
              <div><span>تعداد زیرموضوعات</span><p>{items.filter((item) => item.PID === selectedParent.ID).length.toLocaleString("fa-IR")}</p></div>
            </div>

            {childError && <div className={styles.errorMessage} role="alert">{childError}</div>}

            {childFormOpen && (
              <div className={styles.childFormPanel}>
                <div className={styles.childFormTitle}><span>{childEditingId ? "ویرایش زیرموضوع" : "افزودن زیرموضوع جدید"}</span><button onClick={() => setChildFormOpen(false)} disabled={busy} aria-label="بستن فرم"><Icon name="close" size={16} /></button></div>
                <div className={styles.childFormGrid}>
                  <label><span>شناسه دستی <b>*</b></span><input autoFocus={!childEditingId} value={childId} onChange={(event) => setChildId(event.target.value)} disabled={Boolean(childEditingId) || busy} inputMode="numeric" placeholder="شناسه عددی" /></label>
                  <label><span>عنوان فارسی <b>*</b></span><input value={childNameFarsi} onChange={(event) => setChildNameFarsi(event.target.value)} disabled={busy} placeholder="عنوان زیرموضوع" /></label>
                  <label><span>مقدار</span><input value={childValue} onChange={(event) => setChildValue(event.target.value)} disabled={busy} inputMode="numeric" placeholder="عدد صحیح یا خالی" /></label>
                  <div className={styles.inlineActions}><button className={styles.cancelButton} onClick={() => setChildFormOpen(false)} disabled={busy}>انصراف</button><button className={styles.primaryButton} onClick={() => void saveChild()} disabled={busy}>{busy ? "در حال ذخیره..." : childEditingId ? "ثبت تغییرات" : "افزودن"}</button></div>
                </div>
              </div>
            )}

            <div className={styles.childrenToolbar}><label className={styles.searchBox}><Icon name="search" /><input value={childSearchText} onChange={(event) => setChildSearchText(event.target.value)} placeholder="جستجو در زیرموضوعات..." /></label><span>{childItems.length.toLocaleString("fa-IR")} زیرموضوع</span></div>

            <div className={`${styles.tableWrap} ${styles.childrenTable}`}>
              <table>
                <thead><tr><th>ردیف</th><th>شناسه</th><th>عنوان فارسی</th><th>مقدار</th><th className={styles.actionsTitle}>عملیات</th></tr></thead>
                <tbody>
                  {childItems.length === 0 ? <tr><td className={styles.empty} colSpan={5}>{childSearchText ? "زیرموضوعی با این عبارت پیدا نشد." : "هنوز زیرموضوعی برای این تعریف ثبت نشده است."}</td></tr> : childItems.map((item, index) => (
                    <tr key={item.ID}>
                      <td className={styles.muted}>{(index + 1).toLocaleString("fa-IR")}</td>
                      <td><span className={styles.idBadge}>{item.ID}</span></td>
                      <td className={styles.nameCell}>{item.NameFarsi || "—"}</td>
                      <td>{item.Value === null ? <span className={styles.noValue}>—</span> : item.Value.toLocaleString("fa-IR")}</td>
                      <td><span className={styles.actions}><button className={styles.editButton} onClick={() => openEditChild(item)} disabled={busy} aria-label={`ویرایش ${item.NameFarsi || item.ID}`}><Icon name="edit" size={17} /></button><button className={styles.deleteButton} onClick={() => void deleteItem(item, true)} disabled={busy} aria-label={`حذف ${item.NameFarsi || item.ID}`}><Icon name="trash" size={17} /></button></span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
