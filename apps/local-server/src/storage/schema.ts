export const WORKSHEETS = {
  Users: ["UserID", "Username", "PasswordHash", "Role", "Status", "CreatedAt"],
  Guests: ["GuestID", "Name", "Email", "Phone", "IdentityNumber", "CreatedAt"],
  RoomTypes: ["TypeID", "TypeName", "Description", "BasePrice", "Capacity", "IsActive"],
  Rooms: ["RoomID", "RoomNumber", "TypeID", "Floor", "Status", "Notes"],
  Reservations: ["BookingID", "GuestID", "CheckIn", "CheckOut", "Status", "Total", "CreatedAt", "CreatedBy"],
  ReservationRooms: ["ReservationRoomID", "BookingID", "RoomID", "NightlyRate"],
  Payments: ["PaymentID", "BookingID", "Amount", "Method", "Status", "PaidAt", "RecordedBy"],
  Housekeeping: ["TaskID", "RoomID", "CleaningStatus", "UpdatedAt", "UpdatedBy"],
  Expenses: ["ExpenseID", "Date", "Category", "Description", "Amount", "RecordedBy"],
  AuditLogs: ["LogID", "UserID", "Action", "EntityType", "EntityID", "Timestamp", "Details"],
  Settings: ["SettingKey", "SettingValue"],
} as const;

export const DEFAULT_ROOM_TYPES = [
  ["RT001", "Standard", "Kamar Standard Java Hotel", 0, 2, true],
  ["RT002", "Superior", "Kamar Superior Java Hotel", 0, 2, true],
  ["RT003", "Deluxe", "Kamar Deluxe Java Hotel", 0, 2, true],
  ["RT004", "Suite", "Kamar Suite Java Hotel", 0, 2, true],
] as const;
