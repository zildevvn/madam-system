import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="bg-white">
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                        Manage your Restaurant easily
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        View real-time updates and seamlessly control your table assignments directly from the dashboard. This is the new home page!
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/tables"
                            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            View Tables
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
