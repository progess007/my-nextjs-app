const OverviewCard = () => {

  const cardData = [
    { label: "Students", count: 1218, bgColor: "bg-purple-200" },
    { label: "Teachers", count: 124, bgColor: "bg-yellow-200" },
    { label: "Parents", count: 960, bgColor: "bg-purple-200" },
    { label: "Staffs", count: 30, bgColor: "bg-yellow-200" },
  ];


  return(
    <>
        
            {cardData.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg ${item.bgColor} p-4 shadow-md flex flex-col justify-between`}
              >
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    2024/25
                  </span>
                  {/* จุดไข่ปลา */}
                  <div className="flex space-x-1 text-gray-600">
                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                  </div>
                </div>
                {/* Content */}
                <div className="mt-4">
                  <p className="text-3xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
                  <p className="text-sm text-gray-700">{item.label}</p>
                </div>
              </div>
            ))}

    
    </>
  );

}

export default OverviewCard;