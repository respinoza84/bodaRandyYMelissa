import {
  pgTable, serial, text, integer, timestamp, pgEnum, boolean, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const rsvpStatus = pgEnum("rsvp_status", ["pending", "confirmed", "declined"]);

// Una invitación = un grupo (familia, pareja, persona sola). Recibe UN enlace único.
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),          // va en la URL: /invitacion/<code>
  groupKey: text("group_key"),                    // G01, G02... del CSV, solo para trazabilidad
  contactName: text("contact_name").notNull(),
  email: text("email"),
  phone: text("phone"),                           // formato E.164 sin '+', ej. 50688881234
  sentEmailAt: timestamp("sent_email_at", { withTimezone: true }),
  sentWhatsappAt: timestamp("sent_whatsapp_at", { withTimezone: true }),
  viewedAt: timestamp("viewed_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("invitations_code_idx").on(t.code)]);

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  invitationId: integer("invitation_id").notNull().references(() => invitations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isChild: boolean("is_child").default(false).notNull(),
  status: rsvpStatus("status").default("pending").notNull(),
  dietary: text("dietary"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
}, (t) => [index("guests_invitation_idx").on(t.invitationId)]);

export const invitationsRelations = relations(invitations, ({ many }) => ({ guests: many(guests) }));
export const guestsRelations = relations(guests, ({ one }) => ({
  invitation: one(invitations, { fields: [guests.invitationId], references: [invitations.id] }),
}));

export type Invitation = typeof invitations.$inferSelect;
export type Guest = typeof guests.$inferSelect;
