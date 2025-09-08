import React from "react";

const Features = () => {
  const features = [
    { title: "Fast", description: "Lightning fast performance for your app." },
    { title: "Responsive", description: "Works perfectly on all devices." },
    { title: "Modern", description: "Clean, modern, and intuitive design." },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto text-center">
        <h3 className="text-3xl font-semibold text-gray-800 mb-8">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 border rounded shadow hover:shadow-lg"
            >
              <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
