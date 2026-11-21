
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

// Get all documents from a collection
export async function getAll(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map(document => ({
    ...document.data(),
    id: document.id
  }));
}

// Get one document
export async function getById(collectionName, id) {
  const documentRef = doc(db, collectionName, String(id));
  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    throw new Error("Document not found.");
  }

  return {
    ...snapshot.data(),
    id: snapshot.id
  };
}

// Generate the next product ID
async function getNextProductId() {
  const products = await getAll("products");

  const existingNumbers = products.map(product => {
    const match = String(product.id).match(/^prod(\d+)$/);
    return match ? Number(match[1]) : 0;
  });

  const nextNumber = Math.max(0, ...existingNumbers) + 1;

  return `prod${String(nextNumber).padStart(3, "0")}`;
}

// Add a document
export async function createDocument(collectionName, data) {
  const { id, ...documentData } = data;

  // Products keep the prod001, prod002, prod003 ID format
  if (collectionName === "products") {
    if (id) {
      const productRef = doc(db, "products", String(id));

      await setDoc(productRef, documentData);

      return { ...documentData, id: String(id) };
    }

    // Check that the generated ID is not already in use
    for (let attempt = 0; attempt < 10; attempt++) {
      const newId = await getNextProductId();
      const productRef = doc(db, "products", newId);

      const created = await runTransaction(db, async transaction => {
        const existing = await transaction.get(productRef);

        if (existing.exists()) {
          return false;
        }

        transaction.set(productRef, documentData);
        return true;
      });

      if (created) {
        return { ...documentData, id: newId };
      }
    }

    throw new Error("Could not generate a unique product ID.");
  }

  // Use a supplied ID if one exists; otherwise Firestore generates one
  if (id) {
    const documentRef = doc(db, collectionName, String(id));
    await setDoc(documentRef, documentData);

    return { ...documentData, id: String(id) };
  }

  const documentRef = await addDoc(
    collection(db, collectionName),
    documentData
  );

  return { ...documentData, id: documentRef.id };
}

// Update a document
export async function updateDocument(collectionName, id, updates) {
  const documentRef = doc(db, collectionName, String(id));

  await updateDoc(documentRef, updates);

  return {
    id: String(id),
    ...updates
  };
}

// Delete a document
export async function deleteDocument(collectionName, id) {
  const documentRef = doc(db, collectionName, String(id));

  await deleteDoc(documentRef);

  return true;
}

// CATEGORIES
export const getCategories = () => getAll("categories");
export const addCategory = data => createDocument("categories", data);
export const updateCategory = (id, data) =>
  updateDocument("categories", id, data);
export const deleteCategory = id => deleteDocument("categories", id);

// PRODUCTS
export const getProducts = () => getAll("products");
export const getProductById = id => getById("products", id);
export const addProduct = data => createDocument("products", data);
export const updateProduct = (id, data) =>
  updateDocument("products", id, data);
export const deleteProduct = id => deleteDocument("products", id);

// CUSTOMERS
export const getCustomers = () => getAll("customers");
export const addCustomer = data => createDocument("customers", data);
export const updateCustomer = (id, data) =>
  updateDocument("customers", id, data);
export const deleteCustomer = id => deleteDocument("customers", id);

// ORDERS
export const getOrders = () => getAll("orders");
export const addOrder = data => createDocument("orders", data);
export const updateOrder = (id, data) =>
  updateDocument("orders", id, data);
export const deleteOrder = id => deleteDocument("orders", id);

// CART
export const getCart = () => getAll("cart");
export const addCartItem = data => createDocument("cart", data);
export const updateCartItem = (id, data) =>
  updateDocument("cart", id, data);
export const deleteCartItem = id => deleteDocument("cart", id);

// CHECKOUT
export const getCheckouts = () => getAll("checkout");
export const addCheckout = data => createDocument("checkout", data);
export const updateCheckout = (id, data) =>
  updateDocument("checkout", id, data);
export const deleteCheckout = id => deleteDocument("checkout", id);

// INVENTORY
export const getInventory = () => getAll("inventory");
export const addInventory = data => createDocument("inventory", data);
export const updateInventory = (id, data) =>
  updateDocument("inventory", id, data);
export const deleteInventory = id => deleteDocument("inventory", id);

// PAYMENTS
export const getPayments = () => getAll("payments");
export const addPayment = data => createDocument("payments", data);
export const updatePayment = (id, data) =>
  updateDocument("payments", id, data);
export const deletePayment = id => deleteDocument("payments", id);

// Default API object
const API = {
  getAll,
  getById,
  createDocument,
  updateDocument,
  deleteDocument
};

export default API;
