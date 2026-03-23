import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchTables } from "../store/slices/tableSlice";

export default function Tables() {
    const dispatch = useAppDispatch();
    const { items: tables, status, error } = useAppSelector(state => state.table);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

    const loading = status === 'loading';

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Restaurant Tables</h1>
            
            {loading ? (
                <p className="text-gray-500 text-center py-4">Loading tables...</p>
            ) : error ? (
                <p className="text-red-500 text-center py-4">{error}</p>
            ) : tables.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tables found. Add some starting data via the API!</p>
            ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Capacity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {tables.map(table => (
                                <tr key={table.id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{table.id}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{table.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                            table.status === 'empty' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                                            table.status === 'busy' ? 'bg-red-50 text-red-700 ring-red-600/10' : 
                                            table.status === 'reserved' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                                            'bg-gray-50 text-gray-600 ring-gray-500/10'
                                        }`}>
                                            {table.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{table.capacity} people</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
