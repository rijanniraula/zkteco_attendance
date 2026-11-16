import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash } from "iconsax-reactjs";
import { Spinner } from "./ui/spinner";
import { makeApiRequest } from "@/helpers/api";
import { EDITABLE_STATUSES, ENDPOINTS, STATUS_META } from "@/helpers/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormError } from "@/components/ui/field";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import StatusBadge from "./StatusBadge";

/**
 * Edit one user's status for one day.
 * target = { row, date, cell } from the attendance grid. Mount with a key per target.
 */
const OverrideDialog = ({ target, onClose, onSaved }) => {
  const { row, date, cell } = target;
  const [form, setForm] = useState(() => ({
    status: EDITABLE_STATUSES.includes(cell.status) ? cell.status : "present",
    check_in: cell.checkIn || "",
    check_out: cell.checkOut || "",
    reason: cell.edited ? cell.reason : "",
  }));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const run = async (request) => {
    setIsSaving(true);
    setError("");
    try {
      await request();
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    run(() =>
      makeApiRequest({
        endpoint: ENDPOINTS.OVERRIDE,
        method: "PUT",
        requestBody: {
          userId: row.userId,
          date,
          status: form.status,
          check_in: form.check_in || null,
          check_out: form.check_out || null,
          reason: form.reason,
        },
      })
    );
  };

  const handleRemove = () =>
    run(() =>
      makeApiRequest({ endpoint: `${ENDPOINTS.OVERRIDE}/${cell.overrideId}`, method: "DELETE" })
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader
          title={`Edit attendance · ${row.name}`}
          description={format(parseISO(date), "EEEE, dd MMM yyyy")}
        />
        <div className="rounded-xl bg-secondary p-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            Current: <StatusBadge status={cell.status} edited={cell.edited} />
          </div>
          <div className="text-muted-foreground">
            Device punches: {cell.punches.length ? cell.punches.join(", ") : "none"}
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <FormError message={error} />
          <Field label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={update("status")}>
              {EDITABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in (optional)" htmlFor="check_in">
              <Input id="check_in" type="time" value={form.check_in} onChange={update("check_in")} />
            </Field>
            <Field label="Check-out (optional)" htmlFor="check_out">
              <Input id="check_out" type="time" value={form.check_out} onChange={update("check_out")} />
            </Field>
          </div>
          <Field label="Reason" htmlFor="reason" hint="Saved in the audit log and shown to the employee.">
            <Input id="reason" value={form.reason} onChange={update("reason")} required
              placeholder="e.g. Device was offline, present on time" />
          </Field>
          <DialogFooter className="justify-between">
            {cell.edited ? (
              <Button type="button" variant="ghost" onClick={handleRemove} disabled={isSaving}
                className="text-destructive mr-auto">
                <Trash /> Remove edit
              </Button>
            ) : <span />}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OverrideDialog;
