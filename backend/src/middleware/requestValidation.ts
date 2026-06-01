import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

const eventCategories = new Set([
  "marathon", "meetup", "cafe", "club", "community",
  "music", "sports", "tech", "food", "art",
  "wellness", "business", "outdoor", "workshop", "charity", "other",
]);

const eventStatuses = new Set(["draft", "upcoming", "live", "completed", "cancelled"]);

const writableEventFields = new Set([
  "venueId",
  "title",
  "slug",
  "description",
  "shortDescription",
  "bannerUrl",
  "category",
  "tags",
  "status",
  "startDate",
  "endDate",
  "timezone",
  "isOnline",
  "onlineUrl",
  "address",
  "city",
  "state",
  "country",
  "latitude",
  "longitude",
  "capacity",
  "price",
  "currency",
  "isFree",
  "registrationDeadline",
  "minAge",
  "maxAge",
  "requirements",
  "images",
]);

function fail(res: Response, message: string): void {
  res.status(400).json({ message });
}

function sanitizeEventBody(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => writableEventFields.has(key))
  );
}

function isValidDate(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function isNumberInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function currentMinute(): Date {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function validateEventPayload(body: Record<string, unknown>, requireCoreFields: boolean): string | null {
  if (requireCoreFields) {
    if (typeof body.title !== "string" || body.title.trim().length < 3) return "Title must be at least 3 characters.";
    if (typeof body.description !== "string" || body.description.trim().length < 10) return "Description must be at least 10 characters.";
    if (typeof body.category !== "string" || !eventCategories.has(body.category)) return "Valid category is required.";
    if (!isValidDate(body.startDate)) return "Valid startDate is required.";
    if (!isValidDate(body.endDate)) return "Valid endDate is required.";
  }

  if (body.category !== undefined && (typeof body.category !== "string" || !eventCategories.has(body.category))) {
    return "Invalid event category.";
  }
  if (body.status !== undefined && (typeof body.status !== "string" || !eventStatuses.has(body.status))) {
    return "Invalid event status.";
  }
  if (body.startDate !== undefined && !isValidDate(body.startDate)) return "Invalid startDate.";
  if (body.endDate !== undefined && !isValidDate(body.endDate)) return "Invalid endDate.";
  if (isValidDate(body.startDate) && new Date(String(body.startDate)) < currentMinute()) {
    return "Start date cannot be in the past.";
  }

  if (isValidDate(body.startDate) && isValidDate(body.endDate) && new Date(String(body.endDate)) < new Date(String(body.startDate))) {
    return "End date must be after or equal to start date.";
  }

  if (body.registrationDeadline !== undefined && body.registrationDeadline !== null && !isValidDate(body.registrationDeadline)) {
    return "Invalid registrationDeadline.";
  }

  if (body.latitude !== undefined && body.latitude !== null && !isNumberInRange(body.latitude, -90, 90)) {
    return "Latitude must be between -90 and 90.";
  }
  if (body.longitude !== undefined && body.longitude !== null && !isNumberInRange(body.longitude, -180, 180)) {
    return "Longitude must be between -180 and 180.";
  }
  if (body.capacity !== undefined && body.capacity !== null) {
    const capacity = body.capacity;
    if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 0) {
      return "Capacity must be a positive integer.";
    }
  }
  if (body.price !== undefined) {
    const price = body.price;
    if (typeof price !== "number" || price < 0) {
      return "Price must be a positive number.";
    }
  }
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== "string"))) {
    return "Tags must be an array of strings.";
  }
  if (body.venueId !== undefined && body.venueId !== null && !mongoose.isValidObjectId(String(body.venueId))) {
    return "Invalid venueId.";
  }

  return null;
}

export function validateCreateEvent(req: Request, res: Response, next: NextFunction): void {
  req.body = sanitizeEventBody(req.body ?? {});
  const error = validateEventPayload(req.body, true);
  if (error) {
    fail(res, error);
    return;
  }
  next();
}

export function validateUpdateEvent(req: Request, res: Response, next: NextFunction): void {
  req.body = sanitizeEventBody(req.body ?? {});
  if (Object.keys(req.body).length === 0) {
    fail(res, "At least one valid event field is required.");
    return;
  }

  const error = validateEventPayload(req.body, false);
  if (error) {
    fail(res, error);
    return;
  }
  next();
}

export function validateRegistrationBody(req: Request, res: Response, next: NextFunction): void {
  const { eventId, attendeeDetails } = req.body ?? {};
  if (!eventId || !mongoose.isValidObjectId(String(eventId))) {
    fail(res, "Valid eventId is required.");
    return;
  }
  if (attendeeDetails !== undefined && (typeof attendeeDetails !== "object" || Array.isArray(attendeeDetails))) {
    fail(res, "attendeeDetails must be an object.");
    return;
  }
  next();
}
