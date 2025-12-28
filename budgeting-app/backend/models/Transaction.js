// Firebase doesn't require traditional models like Mongoose,
// but we'll keep this file for consistency and to define data structures

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.user = data.user;
    this.amount = data.amount;
    this.description = data.description;
    this.category = data.category;
    this.date = data.date || new Date();
    this.type = data.type;
    this.account = data.account;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Convert to Firestore-compatible object
  toFirestore() {
    return {
      user: this.user,
      amount: this.amount,
      description: this.description,
      category: this.category,
      date: this.date,
      type: this.type,
      account: this.account,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firestore document
  static fromFirestore(id, data) {
    return new Transaction({
      id,
      user: data.user,
      amount: data.amount,
      description: data.description,
      category: data.category,
      date: data.date?.toDate(),
      type: data.type,
      account: data.account,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    });
  }
}

module.exports = Transaction;