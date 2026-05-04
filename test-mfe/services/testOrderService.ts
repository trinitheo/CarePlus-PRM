
import type { Order, Patient } from '../types';
import { authService } from '../../PatientMFE/services/authService';

export type EnrichedOrder = Order & {
    patientName: string;
    patientAvatar: string;
    patientId: string;
}

export const testOrderService = {
    async addOrder(patientId: string, orderData: any): Promise<Order> {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('User not logged in.');
        }

        const query = `
            mutation AddOrder($input: AddOrderInput!) {
                addOrder(input: $input) {
                    id
                    patientId
                    orderDate
                    orderingPhysician
                    reasonForRequest
                    status
                    orderType
                    urgency
                    fastingRequired
                    specimenType
                }
            }
        `;

        const res = await fetch('/graphql', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.stringify(currentUser)}`
            },
            body: JSON.stringify({ 
                query, 
                variables: { 
                    input: {
                        patientId,
                        ...orderData
                    } 
                } 
            })
        });

        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message || 'Failed to add order');
        return data.addOrder;
    },

    async updateOrder(patientId: string, orderId: string, updateData: any): Promise<Order> {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            throw new Error('User not logged in.');
        }

        const query = `
            mutation UpdateOrder($input: UpdateOrderInput!) {
                updateOrder(input: $input) {
                    id
                    patientId
                    orderDate
                    orderingPhysician
                    reasonForRequest
                    status
                    orderType
                    results
                }
            }
        `;

        const res = await fetch('/graphql', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.stringify(currentUser)}`
            },
            body: JSON.stringify({ 
                query, 
                variables: { 
                    input: {
                        patientId,
                        orderId,
                        ...updateData
                    } 
                } 
            })
        });

        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message || 'Failed to update order');
        return data.updateOrder;
    },

    /**
     * Aggregates all orders from all patients into a single flat list.
     * Enriches the order object with patient details for display.
     */
    async getAllOrders(): Promise<EnrichedOrder[]> {
        const query = `
          query {
            patients {
              id
              name
              avatar
              orders {
                id
                patientId
                orderDate
                orderingPhysician
                reasonForRequest
                status
                orderType
                tests {
                  testId
                  testName
                }
                urgency
                fastingRequired
                specimenType
                results
                parsedResults {
                  testName
                  value
                  unit
                  referenceRange
                  isAbnormal
                  flag
                }
              }
            }
          }
        `;
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message || 'Failed to fetch patients for orders');
        const patients: Patient[] = data.patients;
        const allOrders: EnrichedOrder[] = [];

        patients.forEach(patient => {
            if (patient.orders) {
                patient.orders.forEach(order => {
                    allOrders.push({
                        ...order,
                        patientName: patient.name,
                        patientAvatar: patient.avatar,
                        patientId: patient.id
                    });
                });
            }
        });

        // Sort by date descending (newest first)
        return allOrders.sort((a, b) => 
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        );
    },

    /**
     * Helper to find a patient for the order creation flow
     */
    async searchPatients(query: string): Promise<Patient[]> {
        const graphqlQuery = `
          query {
            patients {
              id
              name
              avatar
              dob
              gender
            }
          }
        `;
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery })
        });
        const { data, errors } = await res.json();
        if (errors) throw new Error(errors[0].message || 'Failed to search patients');
        const patients: Patient[] = data.patients;
        const lowerQuery = query.toLowerCase();
        return patients.filter(p => 
            !p.archived && 
            (p.name.toLowerCase().includes(lowerQuery) || p.id.toLowerCase().includes(lowerQuery))
        );
    }
};
