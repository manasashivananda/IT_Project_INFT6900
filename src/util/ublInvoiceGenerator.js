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
        .ele('rsm:ExchangedDocumentContext')
            .ele('ram:GuidelineSpecifiedDocumentContextParameter')
                .ele('ram:ID').txt('urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended').up()
            .up()
        .up()
        .ele('rsm:ExchangedDocument')
            .ele('ram:ID').txt(data.invoiceNumber).up()
            .ele('ram:TypeCode').txt('380').up()
            .ele('ram:IssueDateTime')
                .ele('udt:DateTimeString', { format: '102' }).txt(data.issueDate).up()
            .up()
            .ele('ram:IncludedNote')
                .ele('ram:Content').txt('AFTER PAYMENT CLICK HERE: https://www.google.com/').up()
                .ele('ram:SubjectCode').txt('AAI').up()
            .up()
            .ele('ram:IncludedNote')
                .ele('ram:Content').txt('EBUSINESS SOFTWARE FRANCESOCIETE ANONYMECAPITAL SOCIAL 914694,10 EURB 412193567').up()
                .ele('ram:SubjectCode').txt('REG').up()
            .up()
        .up();



    // Add Buyer and Seller Parties
    xml.ele('rsm:SupplyChainTradeTransaction')
        .ele('ram:BuyerParty')
            .ele('ram:Name').txt(data.customerParty.name).up()
            .ele('ram:PostalTradeAddress')
                .ele('ram:LineOne').txt(data.customerParty.address.streetName).up()
                .ele('ram:CityName').txt(data.customerParty.address.cityName).up()
                .ele('ram:PostcodeCode').txt(data.customerParty.address.postalZone).up()
                .ele('ram:CountryID').txt(data.customerParty.address.country).up()
            .up()
        .up()
        .ele('ram:SellerParty')
            .ele('ram:Name').txt(data.supplierParty.name).up()
            .ele('ram:PostalTradeAddress')
                .ele('ram:LineOne').txt(data.supplierParty.address.streetName).up()
                .ele('ram:CityName').txt(data.supplierParty.address.cityName).up()
                .ele('ram:PostcodeCode').txt(data.supplierParty.address.postalZone).up()
                .ele('ram:CountryID').txt(data.supplierParty.address.country).up()
            .up()
        .up();

    // Loop through items to create line items
    data.items.forEach(item => {
        xml.ele('ram:IncludedSupplyChainTradeLineItem')
            .ele('ram:AssociatedDocumentLineDocument')
                .ele('ram:LineID').txt(item.itemCode).up()
            .up()
            .ele('ram:SpecifiedTradeProduct')
                .ele('ram:GlobalID', { schemeID: 'IN' }).txt(item.itemCode).up() // Add GlobalID
                .ele('ram:SellerAssignedID').txt(item.itemCode).up()
                .ele('ram:BuyerAssignedID').txt(item.itemCode).up()
                .ele('ram:Name').txt(item.description).up()
            .up()
            .ele('ram:SpecifiedLineTradeAgreement')
                .ele('ram:NetPriceProductTradePrice')
                    .ele('ram:ChargeAmount').txt(item.price.priceAmount).up()
                    .ele('ram:BasisQuantity', { unitCode: 'C62' }).txt(item.quantity).up()
                .up()
            .up()
            .ele('ram:SpecifiedLineTradeDelivery')
                .ele('ram:BilledQuantity', { unitCode: 'C62' }).txt(item.quantity).up()
            .up()
            .ele('ram:SpecifiedLineTradeSettlement')
                .ele('ram:ApplicableTradeTax')
                    .ele('ram:TypeCode').txt(item.tax.taxTypeCode).up()
                    .ele('ram:TaxAmount').txt(item.tax.taxAmount).up()
                    .ele('ram:RateApplicablePercent').txt(item.tax.taxPercent).up()
                .up()
                .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
                    .ele('ram:LineTotalAmount').txt(item.lineTotalAmount).up()
                .up()
            .up()
        .up();
    });

    // Add additional fee, discount, and grand total
    xml.ele('ram:ApplicableHeaderTradeSettlement')
        .ele('ram:InvoiceCurrencyCode').txt(data.currencyCode).up()
        .ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
            .ele('ram:LineTotalAmount').txt(data.totalAmount).up()
            .ele('ram:TaxTotalAmount').txt(data.taxTotal).up()
            .ele('ram:GrandTotalAmount').txt(data.grandTotal).up()
            .ele('ram:DuePayableAmount').txt(data.payableAmount).up()
        .up()
    .up();

    return xml.end({ prettyPrint: true });
}

module.exports = generateUBLXML;
