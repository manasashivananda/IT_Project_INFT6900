const { create } = require('xmlbuilder2');

function generateUBLXML(data) {
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('rsm:CrossIndustryInvoice', {
            xmlns: {
                xsi: "http://www.w3.org/2001/XMLSchema-instance",
                qdt: "urn:un:unece:uncefact:data:standard:QualifiedDataType:100",
                udt: "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
                rsm: "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
                ram: "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
            }
        })
        .ele('rsm:ExchangedDocument')
            .ele('ram:ID').txt(data.invoiceNumber).up()
            .ele('ram:IssueDateTime').ele('udt:DateTimeString', { format: '102' }).txt(data.invoiceDate).up()
        .up()
        .ele('rsm:SupplyChainTradeTransaction');

    // Loop through items to create line items
    data.items.forEach(item => {
        xml.ele('ram:IncludedSupplyChainTradeLineItem')
            .ele('ram:AssociatedDocumentLineDocument')
                .ele('ram:LineID').txt(item.itemCode).up()
            .up()
            .ele('ram:SpecifiedTradeProduct')
                .ele('ram:SellerAssignedID').txt(item.itemCode).up()
                .ele('ram:Name').txt(item.description).up()
            .up()
            .ele('ram:SpecifiedLineTradeDelivery')
                .ele('ram:BilledQuantity', { unitCode: 'C62' }).txt(item.quantity).up()
            .up()
            .ele('ram:SpecifiedLineTradeSettlement')
                .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
                    .ele('ram:LineTotalAmount').txt(item.lineTotalAmount).up() // Ensure this uses the correct line total
                .up()
            .up()
        .up();
    });

    // Add applicable header trade settlement
    xml.ele('ram:ApplicableHeaderTradeSettlement')
        .ele('ram:InvoiceCurrencyCode').txt(data.currency || 'MYR').up() // Default to MYR if not provided
        .ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
            .ele('ram:TaxTotalAmount', { currencyID: data.currency || 'MYR' }).txt(data.taxAmount || 0).up()
            .ele('ram:GrandTotalAmount').txt(data.totalAmount).up()
        .up()
    .up();

    return xml.end({ prettyPrint: true });
}

module.exports = generateUBLXML;
